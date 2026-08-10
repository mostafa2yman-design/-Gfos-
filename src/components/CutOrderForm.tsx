import React, { useState, useEffect } from 'react';
import { ProductionOrder, CutOrderData, CutSizeData, CutVariant } from '../types';
import { getOrderById, saveOrder } from '../lib/storage';
import { Check, Save } from 'lucide-react';

interface CutOrderFormProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function CutOrderForm({ orderId, onSaved }: CutOrderFormProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [cutData, setCutData] = useState<CutOrderData | null>(null);

  useEffect(() => {
    const found = getOrderById(orderId);
    if (found) {
      setOrder(found);
      if (found.cutData) {
        setCutData(found.cutData);
      } else {
        // Initialize from production sizes
        const initialSizes: CutSizeData[] = found.sizes.map(s => ({
          size: s.size,
          variants: s.variants.map(v => ({
            color: v.color,
            plannedQuantity: v.quantity,
            actualQuantity: v.quantity // Default to planned
          }))
        }));
        
        setCutData({
          cutOrderNumber: `CUT-${found.orderNumber}`,
          sizes: initialSizes,
          actualWeight: 0,
          weightUnit: 'كجم'
        });
      }
    }
  }, [orderId]);

  if (!order || !cutData) return <div>جاري التحميل...</div>;

  const isReadOnly = ['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status);

  const handleVariantChange = (sizeIndex: number, variantIndex: number, value: number) => {
    if (isReadOnly) return;
    const newSizes = [...cutData.sizes];
    newSizes[sizeIndex].variants[variantIndex].actualQuantity = value;
    setCutData({ ...cutData, sizes: newSizes });
  };

  const handleSaveDraft = () => {
    if (isReadOnly) return;
    const updatedOrder: ProductionOrder = {
      ...order,
      cutData,
      status: order.status === 'أمر إنتاج معتمد' ? 'القص الفعلي مدخل' : order.status
    };
    saveOrder(updatedOrder);
    onSaved();
  };

  const handleApproveCut = () => {
    if (isReadOnly) return;
    if (window.confirm('هل أنت متأكد من اعتماد أمر القص؟ لن تتمكن من تعديل كميات القص أو البيانات الأساسية بعد الاعتماد.')) {
      const updatedOrder: ProductionOrder = {
        ...order,
        cutData: {
          ...cutData,
          approvedBy: 'المستخدم الحالي',
          approvedAt: new Date().toISOString()
        },
        status: 'القص معتمد'
      };
      saveOrder(updatedOrder);
      onSaved();
    }
  };

  let totalPlanned = 0;
  let totalActual = 0;

  cutData.sizes.forEach(s => {
    s.variants.forEach(v => {
      totalPlanned += v.plannedQuantity;
      totalActual += v.actualQuantity;
    });
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800">أمر القص: {cutData.cutOrderNumber}</h3>
          <p className="text-sm text-slate-500">إدخال الكميات المقصوصة فعلياً</p>
        </div>
        <div className="flex gap-3">
          {!isReadOnly && (
            <>
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                حفظ
              </button>
              <button
                onClick={handleApproveCut}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
              >
                <Check className="w-4 h-4" />
                اعتماد القص الفعلي
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">إجمالي المخطط</p>
          <p className="text-2xl font-bold text-slate-800">{totalPlanned}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">إجمالي المقصوص الفعلي</p>
          <p className="text-2xl font-bold text-indigo-600">{totalActual}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">الفرق</p>
          <p className={`text-2xl font-bold ${totalActual >= totalPlanned ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalActual >= totalPlanned ? '+' : ''}{totalActual - totalPlanned}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h4 className="font-bold text-slate-800">الوزن الفعلي المسحوب</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <input
              type="number"
              value={cutData.actualWeight || ''}
              onChange={e => {
                if(!isReadOnly) setCutData({...cutData, actualWeight: parseFloat(e.target.value) || 0})
              }}
              disabled={isReadOnly}
              placeholder="الوزن الإجمالي"
              className={`w-full px-4 py-2 border rounded-lg ${isReadOnly ? 'bg-slate-50' : 'bg-white focus:ring-2 focus:ring-indigo-500'}`}
            />
          </div>
          <div className="w-32">
            <select
              value={cutData.weightUnit}
              onChange={e => {
                if(!isReadOnly) setCutData({...cutData, weightUnit: e.target.value})
              }}
              disabled={isReadOnly}
              className={`w-full px-4 py-2 border rounded-lg ${isReadOnly ? 'bg-slate-50' : 'bg-white focus:ring-2 focus:ring-indigo-500'}`}
            >
              <option value="كجم">كجم</option>
              <option value="متر">متر</option>
              <option value="قطعة">قطعة</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">المقاس</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">اللون</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">المعياري</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600 w-48">الفعلي المقصوص</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cutData.sizes.map((size, sIdx) => (
              <React.Fragment key={size.size}>
                {size.variants.map((variant, vIdx) => (
                  <tr key={`${size.size}-${variant.color}`}>
                    {vIdx === 0 && (
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 align-top" rowSpan={size.variants.length}>
                        {size.size}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {variant.color}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {variant.plannedQuantity}
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="number"
                        min="0"
                        value={variant.actualQuantity === 0 ? '' : variant.actualQuantity}
                        onChange={(e) => handleVariantChange(sIdx, vIdx, parseInt(e.target.value, 10) || 0)}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 border rounded text-sm text-center font-bold ${
                          isReadOnly ? 'bg-slate-50 text-slate-700' : 'bg-white focus:ring-2 focus:ring-indigo-500 text-indigo-700'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
