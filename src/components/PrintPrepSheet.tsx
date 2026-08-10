import React, { useState, useEffect } from 'react';
import { ProductionOrder, BatchItem, AccessoryPrepItem } from '../types';
import { getOrderById, saveOrder } from '../lib/storage';
import { Printer, Check, CheckSquare, Square } from 'lucide-react';

interface PrintPrepSheetProps {
  orderId: string;
  onSaved: () => void;
}

export function PrintPrepSheet({ orderId, onSaved }: PrintPrepSheetProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    const found = getOrderById(orderId);
    if (found) {
      // Ensure accessoriesPrep is initialized for each batch
      let needsSave = false;
      const updatedBatches = found.batches?.map(batch => {
        if (!batch.accessoriesPrep || batch.accessoriesPrep.length === 0) {
          needsSave = true;
          // Calculate required quantities
          const prepItems: AccessoryPrepItem[] = (found.accessories || []).map(acc => {
            let required = 0;
            if (acc.standardMethod === 'موحد') {
              let batchTotal = 0;
              batch.sizes.forEach(s => s.variants.forEach(v => batchTotal += v.quantity));
              required = batchTotal * acc.unifiedStandard;
            } else {
              batch.sizes.forEach(s => {
                let sizeTotal = 0;
                s.variants.forEach(v => sizeTotal += v.quantity);
                const sizeStd = acc.sizeStandards.find(st => st.size === s.size)?.standard || 0;
                required += sizeTotal * sizeStd;
              });
            }
            return {
              accessoryId: acc.id,
              accessoryName: acc.name,
              unit: acc.unit,
              requiredQuantity: required,
              actualPrepared: 0,
              waste: 0,
              isPrepared: false
            };
          });
          return { ...batch, accessoriesPrep: prepItems };
        }
        return batch;
      });

      if (needsSave && updatedBatches) {
        const updatedOrder = { ...found, batches: updatedBatches, status: found.status === 'الباتشات مثبتة' ? 'التجهيز جاري' as const : found.status };
        saveOrder(updatedOrder);
        setOrder(updatedOrder);
      } else {
        setOrder(found);
      }
    }
  }, [orderId]);

  if (!order || !order.batches) return <div>جاري التحميل...</div>;

  const handleUpdatePrep = (batchId: string, accId: string, field: keyof AccessoryPrepItem, value: string | number | boolean) => {
    const updatedBatches = order.batches!.map(b => {
      if (b.id !== batchId) return b;
      if (b.prepStatus === 'مكتمل') return b; // locked
      return {
        ...b,
        accessoriesPrep: b.accessoriesPrep.map(acc => {
          if (acc.accessoryId !== accId) return acc;
          const updatedAcc = { ...acc, [field]: value };
          if (field === 'isPrepared' && value === true) {
            updatedAcc.preparedBy = 'المستخدم الحالي';
            updatedAcc.preparedAt = new Date().toISOString();
          }
          return updatedAcc;
        })
      };
    });
    
    // Status update logic
    let allCompleted = true;
    let anyStarted = false;
    updatedBatches.forEach(b => {
      if (b.prepStatus !== 'مكتمل') allCompleted = false;
      if (b.accessoriesPrep.some(a => a.isPrepared)) anyStarted = true;
    });

    let newStatus = order.status;
    if (allCompleted) newStatus = 'التجهيز مكتمل';
    else if (anyStarted && order.status === 'الباتشات مثبتة') newStatus = 'التجهيز جاري';

    const updatedOrder = { ...order, batches: updatedBatches, status: newStatus };
    saveOrder(updatedOrder);
    setOrder(updatedOrder);
  };

  const handleApproveBatch = (batchId: string) => {
    if (!window.confirm('هل أنت متأكد من اعتماد التجهيز لهذا الباتش؟')) return;
    
    const updatedBatches = order.batches!.map(b => {
      if (b.id !== batchId) return b;
      return {
        ...b,
        prepStatus: 'مكتمل' as const,
        prepApprovedBy: 'المستخدم الحالي',
        prepApprovedAt: new Date().toISOString()
      };
    });

    const allCompleted = updatedBatches.every(b => b.prepStatus === 'مكتمل');
    const updatedOrder = { 
      ...order, 
      batches: updatedBatches, 
      status: allCompleted ? 'التجهيز مكتمل' as const : 'التجهيز جاري' as const 
    };
    
    saveOrder(updatedOrder);
    setOrder(updatedOrder);
    onSaved(); // trigger parent update if needed
  };

  return (
    <div className="space-y-8 p-6 print:p-0">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 print:hidden">
        <div>
          <h3 className="font-bold text-slate-800">شيت الطباعة والتجهيز</h3>
          <p className="text-sm text-slate-500">تجهيز الإكسسوارات واعتمادها لكل دفعة تشغيل</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm font-medium text-sm"
        >
          <Printer className="w-4 h-4" />
          طباعة الشيت
        </button>
      </div>

      {order.batches.map(batch => {
        let batchTotal = 0;
        batch.sizes.forEach(s => s.variants.forEach(v => batchTotal += v.quantity));
        const isLocked = batch.prepStatus === 'مكتمل';

        return (
          <div key={batch.id} className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden print:shadow-none print:border-black print:mb-8 print:break-inside-avoid">
            {/* Header */}
            <div className="border-b border-slate-300 p-6 bg-slate-50 print:bg-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">شيت تشغيل وتجهيز</h2>
                  <p className="text-sm text-slate-500 mt-1">مصنع GFOS للملابس</p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-indigo-700 print:text-black">{batch.batchNumber}</p>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    التاريخ: {new Date().toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">أمر الإنتاج</p>
                  <p className="font-bold text-slate-800">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">القصة</p>
                  <p className="font-bold text-slate-800">{order.styleName}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">النوع</p>
                  <p className="font-bold text-slate-800">{order.category}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">العميل</p>
                  <p className="font-bold text-slate-800">{order.customerName}</p>
                </div>
              </div>
            </div>

            {/* Batch Contents */}
            <div className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 border-b pb-2 border-slate-200">محتوى الباتش</h4>
              <div className="flex flex-wrap gap-6 mb-2">
                {batch.sizes.map(size => (
                  <div key={size.size} className="space-y-1">
                    <p className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded text-center mb-2">{size.size}</p>
                    {size.variants.map(v => (
                      <div key={v.color} className="flex justify-between gap-4 text-sm">
                        <span className="text-slate-600">{v.color}</span>
                        <span className="font-bold text-indigo-600 print:text-black">{v.quantity}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">إجمالي الباتش:</span>
                <span className="text-lg font-bold text-indigo-600 print:text-black">{batchTotal} قطعة</span>
              </div>
            </div>

            {/* Prep Accessories */}
            <div className="p-6 border-t border-slate-300">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800">الإكسسوارات المطلوبة للتجهيز</h4>
                <span className={`px-3 py-1 text-xs font-bold rounded-full print:hidden ${isLocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isLocked ? 'مكتمل ومعتمد' : 'جاري التجهيز'}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 print:bg-white text-slate-600 border-b-2 border-slate-200">
                    <tr>
                      <th className="py-3 px-2 w-8 print:hidden"></th>
                      <th className="py-3 px-2">الإكسسوار</th>
                      <th className="py-3 px-2 w-16">الوحدة</th>
                      <th className="py-3 px-2 w-24">المطلوب</th>
                      <th className="py-3 px-2 w-28">تم التجهيز</th>
                      <th className="py-3 px-2 w-24">الهالك</th>
                      <th className="py-3 px-2 w-24">المتبقي</th>
                      <th className="py-3 px-2 w-32 print:hidden">التجهيز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batch.accessoriesPrep?.map(acc => {
                      const remaining = acc.requiredQuantity - (acc.actualPrepared || 0) + (acc.waste || 0);
                      return (
                        <tr key={acc.accessoryId} className={acc.isPrepared ? 'bg-emerald-50/30' : ''}>
                          <td className="py-3 px-2 print:hidden">
                            <button
                              onClick={() => handleUpdatePrep(batch.id, acc.accessoryId, 'isPrepared', !acc.isPrepared)}
                              disabled={isLocked}
                              className="text-slate-400 hover:text-emerald-600 disabled:opacity-50 transition-colors"
                            >
                              {acc.isPrepared ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5" />}
                            </button>
                          </td>
                          <td className="py-3 px-2 font-medium text-slate-800">{acc.accessoryName}</td>
                          <td className="py-3 px-2 text-slate-500">{acc.unit}</td>
                          <td className="py-3 px-2 font-bold text-slate-700">{acc.requiredQuantity.toFixed(2)}</td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={acc.actualPrepared || ''}
                              onChange={(e) => handleUpdatePrep(batch.id, acc.accessoryId, 'actualPrepared', parseFloat(e.target.value) || 0)}
                              disabled={isLocked}
                              className={`w-full px-2 py-1.5 border rounded text-sm text-center ${isLocked ? 'bg-transparent border-transparent' : 'bg-white focus:ring-1 focus:ring-indigo-500'} print:border-none`}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={acc.waste === 0 ? '' : acc.waste}
                              onChange={(e) => handleUpdatePrep(batch.id, acc.accessoryId, 'waste', parseFloat(e.target.value) || 0)}
                              disabled={isLocked}
                              placeholder="0"
                              className={`w-full px-2 py-1.5 border rounded text-sm text-center ${isLocked ? 'bg-transparent border-transparent text-red-600' : 'bg-white focus:ring-1 focus:ring-red-500 text-red-600'} print:border-none`}
                            />
                          </td>
                          <td className="py-3 px-2 font-bold text-slate-600">
                            {remaining.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 print:hidden text-xs text-slate-500">
                            {acc.isPrepared ? (
                              <span className="text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3"/> تم</span>
                            ) : (
                              'انتظار'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!isLocked && (
                <div className="mt-6 flex justify-end print:hidden">
                  <button
                    onClick={() => handleApproveBatch(batch.id)}
                    disabled={!batch.accessoriesPrep?.every(a => a.isPrepared)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    اعتماد تجهيز الباتش
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
