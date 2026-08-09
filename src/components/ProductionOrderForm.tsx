import React, { useState, useEffect } from 'react';
import { ProductionOrder, PREDEFINED_SIZES, Variant } from '../types';
import { OrderBasicInfo } from './form/OrderBasicInfo';
import { SizeCard } from './form/SizeCard';
import { OrderSummary } from './form/OrderSummary';
import { generateOrderNumber, saveOrder, getOrderById } from '../lib/storage';
import { Save, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';

interface ProductionOrderFormProps {
  orderId?: string | null;
  onSaved: () => void;
}

export function ProductionOrderForm({ orderId, onSaved }: ProductionOrderFormProps) {
  const [order, setOrder] = useState<ProductionOrder>({
    id: crypto.randomUUID(),
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    styleName: '',
    category: '',
    customerName: '',
    status: 'مسودة',
    sizes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const existing = getOrderById(orderId);
      if (existing) {
        setOrder(existing);
      }
    } else {
      setOrder(prev => ({ ...prev, orderNumber: generateOrderNumber() }));
    }
  }, [orderId]);

  const handleBasicInfoChange = (field: string, value: string) => {
    setOrder(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddSize = (sizeName: string) => {
    setOrder(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: sizeName, variants: [] }]
    }));
  };

  const handleRemoveSize = (sizeIndex: number) => {
    setOrder(prev => {
      const newSizes = [...prev.sizes];
      newSizes.splice(sizeIndex, 1);
      return { ...prev, sizes: newSizes };
    });
  };

  const handleCopySize = (sourceIndex: number, targetSizeName: string) => {
    setOrder(prev => {
      const sourceSize = prev.sizes[sourceIndex];
      const newSizes = [...prev.sizes];
      
      // Deep copy variants so they are independent
      const copiedVariants = sourceSize.variants.map(v => ({ ...v }));
      
      newSizes.push({
        size: targetSizeName,
        variants: copiedVariants
      });
      
      return { ...prev, sizes: newSizes };
    });
  };

  const handleAddVariant = (sizeIndex: number) => {
    setOrder(prev => {
      const newSizes = [...prev.sizes];
      newSizes[sizeIndex].variants.push({ color: '', quantity: 0 });
      return { ...prev, sizes: newSizes };
    });
  };

  const handleUpdateVariant = (sizeIndex: number, variantIndex: number, field: keyof Variant, value: string | number) => {
    setOrder(prev => {
      const newSizes = [...prev.sizes];
      newSizes[sizeIndex].variants[variantIndex] = {
        ...newSizes[sizeIndex].variants[variantIndex],
        [field]: value
      };
      return { ...prev, sizes: newSizes };
    });
  };

  const handleRemoveVariant = (sizeIndex: number, variantIndex: number) => {
    setOrder(prev => {
      const newSizes = [...prev.sizes];
      newSizes[sizeIndex].variants.splice(variantIndex, 1);
      return { ...prev, sizes: newSizes };
    });
  };

  const validate = (): boolean => {
    if (!order.styleName.trim()) {
      setError('يجب إدخال اسم القصة.');
      return false;
    }
    if (!order.category) {
      setError('يجب اختيار نوع القصة.');
      return false;
    }
    if (!order.customerName.trim()) {
      setError('يجب إدخال اسم العميل.');
      return false;
    }
    if (order.sizes.length === 0) {
      setError('يجب إضافة مقاس واحد على الأقل.');
      return false;
    }
    
    for (const size of order.sizes) {
      if (size.variants.length === 0) {
        setError(`المقاس ${size.size} لا يحتوي على أي ألوان.`);
        return false;
      }
      for (const variant of size.variants) {
        if (!variant.color) {
          setError(`يوجد لون غير محدد في المقاس ${size.size}.`);
          return false;
        }
        if (!variant.quantity || variant.quantity <= 0) {
          setError(`يجب إدخال كمية أكبر من صفر للون ${variant.color} في المقاس ${size.size}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (validate()) {
      const orderToSave = { ...order, status: 'مسودة' as const };
      saveOrder(orderToSave);
      setSuccess('تم حفظ الأمر كمسودة بنجاح.');
      setError(null);
      setTimeout(() => {
        onSaved();
      }, 1500);
    }
  };

  const usedSizes = order.sizes.map(s => s.size);
  const availableSizes = PREDEFINED_SIZES.filter(s => !usedSizes.includes(s));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {orderId ? 'تعديل أمر الإنتاج' : 'إنشاء أمر إنتاج أولي'}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Save className="w-4 h-4" />
            حفظ كمسودة
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-r-4 border-emerald-500 p-4 rounded-lg flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <OrderBasicInfo
            orderNumber={order.orderNumber}
            orderDate={order.orderDate}
            styleName={order.styleName}
            category={order.category}
            customerName={order.customerName}
            onChange={handleBasicInfoChange}
          />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">جدول المقاسات والألوان</h3>
              {availableSizes.length > 0 && (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    <Plus className="w-4 h-4" />
                    إضافة مقاس
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 hidden group-hover:block group-focus-within:block max-h-60 overflow-y-auto">
                    {availableSizes.map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleAddSize(sz)}
                        className="w-full text-right px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        المقاس {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {order.sizes.length > 0 ? (
                order.sizes.map((sizeData, index) => (
                  <SizeCard
                    key={sizeData.size}
                    sizeData={sizeData}
                    availableSizesToCopy={availableSizes}
                    onUpdateVariant={(vIdx, field, value) => handleUpdateVariant(index, vIdx, field as any, value)}
                    onAddVariant={() => handleAddVariant(index)}
                    onRemoveVariant={(vIdx) => handleRemoveVariant(index, vIdx)}
                    onRemoveSize={() => handleRemoveSize(index)}
                    onCopySize={(targetSize) => handleCopySize(index, targetSize)}
                  />
                ))
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium mb-2">لم يتم إضافة أي مقاسات بعد</p>
                  <p className="text-slate-400 text-sm">قم بإضافة مقاس للبدء في تحديد الألوان والكميات</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <OrderSummary sizes={order.sizes} />
          </div>
        </div>
      </div>
    </div>
  );
}
