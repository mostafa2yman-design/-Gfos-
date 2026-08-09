import React, { useState, useEffect, useRef } from 'react';
import { ProductionOrder, PREDEFINED_SIZES, Variant } from '../types';
import { OrderBasicInfo } from './form/OrderBasicInfo';
import { SizeCard } from './form/SizeCard';
import { OrderSummary } from './form/OrderSummary';
import { generateOrderNumber, saveOrder, getOrderById } from '../lib/storage';
import { Save, AlertCircle, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

interface ProductionOrderFormProps {
  orderId?: string | null;
  onSaved: () => void;
  isViewOnly?: boolean;
}

export function ProductionOrderForm({ orderId, onSaved, isViewOnly = false }: ProductionOrderFormProps) {
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
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const addSizeRef = useRef<HTMLDivElement>(null);

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

  // Click outside listener for Add Size dropdown
  useEffect(() => {
    if (!isAddSizeOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (addSizeRef.current && !addSizeRef.current.contains(event.target as Node)) {
        setIsAddSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAddSizeOpen]);

  const isReadOnly = isViewOnly || order.status !== 'مسودة';

  const handleBasicInfoChange = (field: string, value: string) => {
    if (isReadOnly) return;
    setOrder(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddSize = (sizeName: string) => {
    if (isReadOnly) return;
    setOrder(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: sizeName, variants: [] }]
    }));
    setIsAddSizeOpen(false);
    setError(null);
  };

  const handleRemoveSize = (sizeIndex: number) => {
    if (isReadOnly) return;
    setOrder(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, idx) => idx !== sizeIndex)
    }));
    setError(null);
  };

  const handleCopySize = (sourceIndex: number, targetSizeName: string) => {
    if (isReadOnly) return;
    setOrder(prev => {
      const sourceSize = prev.sizes[sourceIndex];
      if (!sourceSize) return prev;
      
      // Deep copy variants so they are completely independent
      const copiedVariants = sourceSize.variants.map(v => ({ ...v }));
      
      return {
        ...prev,
        sizes: [
          ...prev.sizes,
          {
            size: targetSizeName,
            variants: copiedVariants
          }
        ]
      };
    });
    setError(null);
  };

  const handleAddVariant = (sizeIndex: number) => {
    if (isReadOnly) return;
    setOrder(prev => {
      const newSizes = prev.sizes.map((s, sIdx) => {
        if (sIdx !== sizeIndex) return s;
        return {
          ...s,
          variants: [...s.variants, { color: '', quantity: 0 }]
        };
      });
      return { ...prev, sizes: newSizes };
    });
    setError(null);
  };

  const handleUpdateVariant = (sizeIndex: number, variantIndex: number, field: keyof Variant, value: string | number) => {
    if (isReadOnly) return;
    setOrder(prev => {
      const newSizes = prev.sizes.map((s, sIdx) => {
        if (sIdx !== sizeIndex) return s;
        const newVariants = s.variants.map((v, vIdx) => {
          if (vIdx !== variantIndex) return v;
          return { ...v, [field]: value };
        });
        return { ...s, variants: newVariants };
      });
      return { ...prev, sizes: newSizes };
    });
    setError(null);
  };

  const handleRemoveVariant = (sizeIndex: number, variantIndex: number) => {
    if (isReadOnly) return;
    setOrder(prev => {
      const newSizes = prev.sizes.map((s, sIdx) => {
        if (sIdx !== sizeIndex) return s;
        return {
          ...s,
          variants: s.variants.filter((_, vIdx) => vIdx !== variantIndex)
        };
      });
      return { ...prev, sizes: newSizes };
    });
    setError(null);
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

    const sizeNames = order.sizes.map(s => s.size);
    if (new Set(sizeNames).size !== sizeNames.length) {
      setError('يوجد مقاس مكرر داخل هذا الأمر.');
      return false;
    }
    
    for (const size of order.sizes) {
      if (size.variants.length === 0) {
        setError(`المقاس ${size.size} لا يحتوي على أي ألوان.`);
        return false;
      }

      const colorsInSize = new Set<string>();
      for (const variant of size.variants) {
        if (!variant.color) {
          setError(`يوجد لون غير محدد في المقاس ${size.size}.`);
          return false;
        }

        if (colorsInSize.has(variant.color)) {
          setError(`اللون "${variant.color}" مكرر داخل المقاس ${size.size}.`);
          return false;
        }
        colorsInSize.add(variant.color);

        const qty = Number(variant.quantity);
        if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
          setError(`يجب إدخال كمية صحيحة أكبر من صفر للون ${variant.color} في المقاس ${size.size}.`);
          return false;
        }
      }
    }
    
    setError(null);
    return true;
  };

  const handleSaveDraft = () => {
    if (isReadOnly) return;
    if (validate()) {
      const orderToSave: ProductionOrder = { ...order, status: 'مسودة' as const };
      saveOrder(orderToSave);
      setSuccess('تم حفظ الأمر كمسودة بنجاح.');
      setError(null);
      setTimeout(() => {
        onSaved();
      }, 1200);
    }
  };

  const usedSizes = order.sizes.map(s => s.size);
  const availableSizes = PREDEFINED_SIZES.filter(s => !usedSizes.includes(s));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onSaved}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isReadOnly 
                ? `عرض أمر الإنتاج (${order.orderNumber})` 
                : orderId 
                  ? 'تعديل أمر الإنتاج' 
                  : 'إنشاء أمر إنتاج أولي'}
            </h2>
            {isReadOnly && (
              <span className="inline-block mt-0.5 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                وضع العرض فقط (غير قابل للتعديل)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {isReadOnly ? (
            <button
              onClick={onSaved}
              className="flex items-center gap-2 bg-slate-600 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-medium"
            >
              إغلاق
            </button>
          ) : (
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
              <Save className="w-4 h-4" />
              حفظ كمسودة
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-r-4 border-emerald-500 p-4 rounded-lg flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
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
            readOnly={isReadOnly}
          />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">جدول المقاسات والألوان</h3>
              {!isReadOnly && availableSizes.length > 0 && (
                <div className="relative" ref={addSizeRef}>
                  <button 
                    type="button"
                    onClick={() => setIsAddSizeOpen(prev => !prev)}
                    className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مقاس
                  </button>
                  {isAddSizeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
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
                  )}
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
                    onUpdateVariant={(vIdx, field, value) => handleUpdateVariant(index, vIdx, field, value)}
                    onAddVariant={() => handleAddVariant(index)}
                    onRemoveVariant={(vIdx) => handleRemoveVariant(index, vIdx)}
                    onRemoveSize={() => handleRemoveSize(index)}
                    onCopySize={(targetSize) => handleCopySize(index, targetSize)}
                    readOnly={isReadOnly}
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
