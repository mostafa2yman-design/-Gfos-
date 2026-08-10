cat << 'INNEREOF' > src/components/PrintPrepSheet.tsx
import React, { useState, useEffect } from 'react';
import { ProductionOrder, BatchItem, AccessoryPrepItem } from '../types';
import { getOrderById } from '../lib/storage';
import * as Cmd from '../lib/productionOrderCommands';
import { Printer, Check, CheckSquare, Square } from 'lucide-react';

interface PrintPrepSheetProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function PrintPrepSheet({ orderId, onSaved }: PrintPrepSheetProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  
  useEffect(() => {
    const found = getOrderById(orderId);
    if (found) {
      if (found.batches && found.batches.length > 0 && found.accessories && found.accessories.length > 0) {
        let needsSave = false;
        
        const updatedBatches = found.batches.map(batch => {
          if (!batch.accessoriesPrep || batch.accessoriesPrep.length === 0) {
            needsSave = true;
            return {
              ...batch,
              accessoriesPrep: found.accessories.map(acc => ({
                accessoryName: acc.name,
                isPrepared: false,
                notes: ''
              }))
            };
          }
          return batch;
        });

        if (needsSave && updatedBatches) {
          const result = Cmd.savePrepData(found, updatedBatches);
          if (result.success && result.data) {
            setOrder(result.data);
          }
        } else {
          setOrder(found);
        }
      } else {
        setOrder(found);
      }
    }
  }, [orderId]);

  if (!order || !order.batches || order.batches.length === 0) return <div>لا توجد بيانات باتشات.</div>;

  const handlePrint = (batchId: string) => {
    window.print();
  };

  const handleToggleAccessory = (batchId: string, accessoryName: string) => {
    const updatedBatches = order.batches!.map(b => {
      if (b.id === batchId && b.prepStatus !== 'مكتمل') {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map(a => 
            a.accessoryName === accessoryName ? { ...a, isPrepared: !a.isPrepared } : a
          )
        };
      }
      return b;
    });

    const result = Cmd.savePrepData(order, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };

  const handleApproveBatch = (batchId: string) => {
    if (!window.confirm('هل أنت متأكد من اعتماد التجهيز لهذا الباتش؟')) return;
    
    const result = Cmd.approveBatchPrep(order, batchId);
    if (result.success && result.data) {
      setOrder(result.data);
      onSaved();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-8 p-6 print:p-0 print:space-y-4">
      <div className="print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-800">أوراق التجهيز والطباعة</h3>
          <p className="text-slate-500 text-sm mt-1">
            متابعة تجهيز الإكسسوارات لكل باتش تشغيل
          </p>
        </div>
      </div>

      <div className="space-y-8 print:space-y-12">
        {order.batches.map(batch => {
          const allPrepared = batch.accessoriesPrep?.every(a => a.isPrepared) || false;
          
          return (
            <div key={batch.id} className="bg-white rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none break-inside-avoid">
              <div className="border-b border-slate-200 p-6 print:p-0 print:pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">ورقة تشغيل وتجهيز</h2>
                  <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <p><span className="text-slate-500">رقم الباتش:</span> <span className="font-bold text-lg">{batch.batchNumber}</span></p>
                    <p><span className="text-slate-500">أمر الإنتاج:</span> <span className="font-bold">{order.orderNumber}</span></p>
                    <p><span className="text-slate-500">الموديل:</span> <span className="font-bold">{order.modelName}</span></p>
                    <p><span className="text-slate-500">العميل:</span> <span className="font-bold">{order.clientName}</span></p>
                  </div>
                </div>
                <div className="print:hidden flex gap-2">
                  <button
                    onClick={() => handlePrint(batch.id)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                    title="طباعة ورقة الباتش"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  {batch.prepStatus !== 'مكتمل' ? (
                    <button
                      onClick={() => handleApproveBatch(batch.id)}
                      disabled={!allPrepared}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                        allPrepared 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      اعتماد التجهيز
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-200">
                      <Check className="w-5 h-5" />
                      التجهيز مكتمل
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 print:p-0 print:pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                <div>
                  <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">تفاصيل المقاسات والألوان</h4>
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b">
                        <th className="pb-2 font-medium">المقاس</th>
                        <th className="pb-2 font-medium">اللون</th>
                        <th className="pb-2 font-medium">العدد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                              <td className="py-2 font-bold">{variant.quantity}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">تجهيز الإكسسوارات والطباعة</h4>
                  {(!batch.accessoriesPrep || batch.accessoriesPrep.length === 0) ? (
                    <p className="text-sm text-slate-500">لا توجد إكسسوارات مطلوبة.</p>
                  ) : (
                    <div className="space-y-3">
                      {batch.accessoriesPrep.map(acc => (
                        <div 
                          key={acc.accessoryName} 
                          onClick={() => handleToggleAccessory(batch.id, acc.accessoryName)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            acc.isPrepared 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          } ${batch.prepStatus === 'مكتمل' ? 'pointer-events-none' : ''}`}
                        >
                          <div className={acc.isPrepared ? 'text-emerald-600' : 'text-slate-400'}>
                            {acc.isPrepared ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </div>
                          <span className={`font-medium text-sm ${acc.isPrepared ? 'line-through opacity-70' : ''}`}>
                            {acc.accessoryName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {batch.prepStatus === 'مكتمل' && (
                <div className="bg-emerald-50 p-4 border-t border-emerald-100 flex justify-between items-center text-sm print:text-xs text-emerald-700">
                  <span>تم التجهيز بواسطة: <strong>{batch.prepApprovedBy}</strong></span>
                  <span>تاريخ: {new Date(batch.prepApprovedAt!).toLocaleDateString('ar-EG')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
INNEREOF
