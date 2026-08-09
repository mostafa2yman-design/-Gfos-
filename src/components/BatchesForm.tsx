import React, { useState, useEffect } from 'react';
import { ProductionOrder, BatchItem, BatchSplitMethod, BatchSizeData, BatchVariant } from '../types';
import { getOrderById, saveOrder } from '../lib/storage';
import { Check, Plus, Trash2 } from 'lucide-react';

interface BatchesFormProps {
  orderId: string;
  onSaved: () => void;
}

export function BatchesForm({ orderId, onSaved }: BatchesFormProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    const found = getOrderById(orderId);
    if (found) {
      setOrder(found);
    }
  }, [orderId]);

  if (!order || !order.cutData) return <div>جاري التحميل...</div>;

  const isReadOnly = ['الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status);
  const batches = order.batches || [];
  
  let totalActual = 0;
  order.cutData.sizes.forEach(s => {
    s.variants.forEach(v => {
      totalActual += v.actualQuantity;
    });
  });

  let totalBatches = 0;
  batches.forEach(b => {
    b.sizes.forEach(s => {
      s.variants.forEach(v => {
        totalBatches += v.quantity;
      });
    });
  });

  const handleSplitMethodChange = (method: BatchSplitMethod) => {
    if (isReadOnly) return;
    
    // Auto-generate batches based on method
    let newBatches: BatchItem[] = [];
    
    if (method === 'حسب اللون') {
      // Find all unique colors
      const colors = new Set<string>();
      order.cutData!.sizes.forEach(s => s.variants.forEach(v => colors.add(v.color)));
      
      let batchCount = 1;
      colors.forEach(color => {
        const batchSizes: BatchSizeData[] = [];
        order.cutData!.sizes.forEach(s => {
          const v = s.variants.find(va => va.color === color);
          if (v && v.actualQuantity > 0) {
            batchSizes.push({ size: s.size, variants: [{ color, quantity: v.actualQuantity }] });
          }
        });
        if (batchSizes.length > 0) {
          newBatches.push({
            id: crypto.randomUUID(),
            batchNumber: `B-${order.orderNumber}-${String(batchCount).padStart(3, '0')}`,
            sizes: batchSizes,
            prepStatus: 'جاري',
            accessoriesPrep: []
          });
          batchCount++;
        }
      });
    } else if (method === 'حسب المقاس') {
      let batchCount = 1;
      order.cutData!.sizes.forEach(s => {
        const validVariants = s.variants.filter(v => v.actualQuantity > 0);
        if (validVariants.length > 0) {
          newBatches.push({
            id: crypto.randomUUID(),
            batchNumber: `B-${order.orderNumber}-${String(batchCount).padStart(3, '0')}`,
            sizes: [{
              size: s.size,
              variants: validVariants.map(v => ({ color: v.color, quantity: v.actualQuantity }))
            }],
            prepStatus: 'جاري',
            accessoriesPrep: []
          });
          batchCount++;
        }
      });
    }

    const updatedOrder: ProductionOrder = {
      ...order,
      batchSplitMethod: method,
      batches: newBatches,
      status: order.status === 'القص معتمد' ? 'تقسيم الباتشات' : order.status
    };
    saveOrder(updatedOrder);
    setOrder(updatedOrder);
  };

  const handleLockBatches = () => {
    if (isReadOnly) return;
    if (totalBatches !== totalActual) {
      alert('لا يمكن التثبيت: إجمالي الباتشات لا يساوي إجمالي القص الفعلي.');
      return;
    }
    if (window.confirm('بعد تثبيت الباتشات لن يمكن تعديل توزيع الكميات. هل أنت متأكد؟')) {
      const updatedOrder: ProductionOrder = {
        ...order,
        batchesLockedBy: 'المستخدم الحالي',
        batchesLockedAt: new Date().toISOString(),
        status: 'الباتشات مثبتة'
      };
      saveOrder(updatedOrder);
      onSaved();
    }
  };

  const statusColor = totalBatches === totalActual ? 'text-emerald-600' : totalBatches < totalActual ? 'text-amber-500' : 'text-red-500';
  const statusMessage = totalBatches === totalActual ? 'التوزيع مكتمل' : totalBatches < totalActual ? 'توجد كمية غير موزعة' : 'التوزيع يتجاوز الكمية المقصوصة';

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800">تقسيم الباتشات</h3>
          <p className="text-sm text-slate-500">توزيع القص الفعلي على دفعات تشغيل</p>
        </div>
        <div className="flex gap-3">
          {!isReadOnly && (
            <button
              onClick={handleLockBatches}
              disabled={totalBatches !== totalActual}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm ${
                totalBatches === totalActual ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              تثبيت تقسيم الباتشات
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">القص الفعلي (متاح)</p>
          <p className="text-2xl font-bold text-slate-800">{totalActual}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">إجمالي الموزع في الباتشات</p>
          <p className={`text-2xl font-bold ${statusColor}`}>{totalBatches}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm col-span-2 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">حالة التوزيع</p>
            <p className={`text-lg font-bold ${statusColor}`}>{statusMessage}</p>
          </div>
          {!isReadOnly && (
            <div className="flex gap-2">
              <button
                onClick={() => handleSplitMethodChange('حسب اللون')}
                className={`px-3 py-1.5 text-sm font-medium rounded border ${order.batchSplitMethod === 'حسب اللون' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                تقسيم تلقائي حسب اللون
              </button>
              <button
                onClick={() => handleSplitMethodChange('حسب المقاس')}
                className={`px-3 py-1.5 text-sm font-medium rounded border ${order.batchSplitMethod === 'حسب المقاس' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                تقسيم تلقائي حسب المقاس
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {batches.map(batch => {
          let batchTotal = 0;
          batch.sizes.forEach(s => s.variants.forEach(v => batchTotal += v.quantity));
          
          return (
            <div key={batch.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-slate-800 text-lg">{batch.batchNumber}</h4>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-sm font-medium">
                    الإجمالي: {batchTotal} قطعة
                  </span>
                </div>
              </div>
              <div className="p-4">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-sm text-slate-500 border-b border-slate-100">
                      <th className="pb-2 w-32 font-medium">المقاس</th>
                      <th className="pb-2 w-48 font-medium">اللون</th>
                      <th className="pb-2 font-medium">العدد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {batch.sizes.map((size) => (
                      <React.Fragment key={size.size}>
                        {size.variants.map((variant, vIdx) => (
                          <tr key={`${size.size}-${variant.color}`}>
                            {vIdx === 0 && (
                              <td className="py-2 font-bold text-slate-700" rowSpan={size.variants.length}>
                                {size.size}
                              </td>
                            )}
                            <td className="py-2 text-slate-600">{variant.color}</td>
                            <td className="py-2 text-indigo-600 font-semibold">{variant.quantity}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {batches.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">لم يتم إنشاء أي باتشات بعد</p>
            <p className="text-slate-400 text-sm mt-1">اختر طريقة التقسيم التلقائي للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
