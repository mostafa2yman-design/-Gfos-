import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, BatchItem, FinishingData, FinishingVariantData } from "../types";
import { getOrderById } from "../lib/storage";
import { getLabor } from "../lib/accountingStorage";
import { LaborProfile } from "../types";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Sparkles, Printer, CheckSquare, Settings2, Copy } from "lucide-react";
import { FinishingWorkOrderPrint } from "./print/workorders/FinishingWorkOrderPrint";
import { eventBus } from "../lib/events/eventBus";

interface Props {
  orderId: string;
  onSaved: () => void;
}

export const FinishingForm: React.FC<Props> = ({ orderId, onSaved }) => {
  const [finishingWorkers, setFinishingWorkers] = React.useState<LaborProfile[]>([]);
  React.useEffect(() => {
    setFinishingWorkers(getLabor().filter(l => l.isActive));
  }, []);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: "success" | "error"; } | null>(null);
  
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAll = async () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const o = await getOrderById(orderId);
    if (o) {
      setOrder(o);
      setBatches(
        o.batches?.map((b) => ({
          ...b,
          finishingData: b.finishingData || {
            status: 'لم يبدأ',
            actualQuantities: (b.sewingData?.actualQuantities || []).map(sq => ({
              size: sq.size,
              color: sq.color,
              actualQuantity: sq.actualQuantity
            })) || []
          }
        })) || []
      );
    }
  };

  const handleUpdateFinishingData = (batchId: string, field: keyof FinishingData, value: any) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          finishingData: {
            ...(b.finishingData as FinishingData),
            [field]: value,
          },
        };
      })
    );
  };

  const handleVariantQuantityChange = (batchId: string, size: string, color: string, actualQuantity: number) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId || !b.finishingData) return b;
        
        const existingQty = [...b.finishingData.actualQuantities];
        const idx = existingQty.findIndex(q => q.size === size && q.color === color);
        
        if (idx >= 0) {
          existingQty[idx] = { ...existingQty[idx], actualQuantity };
        } else {
          existingQty.push({ size, color, actualQuantity });
        }
        
        return {
          ...b,
          finishingData: {
            ...b.finishingData,
            actualQuantities: existingQty
          }
        };
      })
    );
  };

  const saveFinishing = async (batchId: string, shouldApprove: boolean = false) => {
    if (!order) return;
    
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || !batch.finishingData) return;

    if (shouldApprove) {
      if (batch.finishingData.actualCostPerPiece === undefined || batch.finishingData.actualCostPerPiece === null) {
        setToastConfig({ message: "يجب إدخال تكلفة التشطيب الفعلية للقطعة قبل الاعتماد.", type: "error" });
        return;
      }
    }

    const updatedOrder = { ...order, batches };
    const savedResult = await Cmd.saveFinishingData(order, batches);

    if (savedResult.success) {
      if (shouldApprove) {
        setConfirmConfig({
          isOpen: true,
          message: `هل أنت متأكد من اعتماد بيانات التشطيب للباتش ${batch.batchNumber}؟ لا يمكن تعديل البيانات بعد الاعتماد.`,
          onConfirm: async () => {
            setConfirmConfig(null);
            
            const approveResult = await Cmd.approveBatchFinishing(savedResult.data!, batchId);
            if (approveResult.success) {
              setToastConfig({ message: "تم الاعتماد بنجاح.", type: "success" });
              if (approveResult.data) setOrder(approveResult.data);
              onSaved();
            } else {
              setToastConfig({ message: approveResult.error || "حدث خطأ أثناء الاعتماد.", type: "error" });
            }
          },
        });
      } else {
        setToastConfig({ message: "تم الحفظ بنجاح.", type: "success" });
        if (savedResult.data) setOrder(savedResult.data);
        onSaved();
      }
    } else {
      setToastConfig({ message: savedResult.error || "حدث خطأ أثناء الحفظ.", type: "error" });
    }
  };
  

  const handleCopyDetails = (sourceBatchId: string) => {
    const sourceBatch = batches.find(b => b.id === sourceBatchId);
    if (!sourceBatch || !sourceBatch.finishingData) return;
    
    const updatedBatches = batches.map(b => {
      if (b.id === sourceBatchId) return b;
      return {
        ...b,
        finishingData: {
          ...b.finishingData!,
          actualCostPerPiece: sourceBatch.finishingData.actualCostPerPiece,
          workerName: sourceBatch.finishingData.workerName
        }
      };
    });
    setBatches(updatedBatches);
    setToastConfig({ message: "تم نسخ تفاصيل التشطيب لجميع الباتشات بنجاح", type: "success" });
  };

  const approveAllFinishing = async () => {
    if (!order) return;
    
    // Check if all batches have finishing cost
    const missingCost = batches.some(b => b.finishingData?.status !== 'مكتمل' && (b.finishingData?.actualCostPerPiece === undefined || b.finishingData?.actualCostPerPiece === null));
    if (missingCost) {
      setToastConfig({ message: "يجب إدخال التكلفة الفعلية للتشطيب لجميع الباتشات غير المعتمدة.", type: "error" });
      return;
    }
    
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من اعتماد جميع الباتشات في التشطيب؟",
      onConfirm: async () => {
        setConfirmConfig(null);
        const saveResult = await Cmd.saveFinishingData(order, batches);
        if (!saveResult.success || !saveResult.data) {
          setToastConfig({ message: saveResult.error || "خطأ", type: "error" });
          return;
        }
        const approveResult = await Cmd.approveAllFinishing(saveResult.data);
        if (approveResult.success) {
          setToastConfig({ message: "تم الاعتماد بنجاح.", type: "success" });
          if (approveResult.data) setOrder(approveResult.data);
          onSaved();
        } else {
          setToastConfig({ message: approveResult.error || "حدث خطأ.", type: "error" });
        }
      }
    });
  };

  if (!order) return <div>جاري التحميل...</div>;

  const isFullyApproved = batches.length > 0 && batches.every(b => b.finishingData?.status === 'مكتمل');
  const isOrderReadOnly = isFullyApproved || ['التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'مغلق'].includes(order.status);

  return (
    <div className="space-y-6 relative">
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => setConfirmConfig(null)}
      />
      {toastConfig && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig(null)} />}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              مرحلة التشطيب
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              إدارة بيانات وتكاليف مرحلة التشطيب لجميع الباتشات
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة أمر التشغيل الشامل
            </button>
            {!isFullyApproved ? (
              <button
                onClick={approveAllFinishing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                اعتماد التشطيب بالكامل
              </button>
            ) : (
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-sm shadow-sm">
                  <CheckSquare className="w-4 h-4" />
                  تم الاعتماد بالكامل
               </div>
            )}
          </div>
        </div>
        
        {order.finishingInstructions && (
           <div className="bg-amber-50 p-4 border-b border-amber-100">
             <h4 className="font-bold text-amber-800 text-sm mb-1">تعليمات التشطيب</h4>
             <p className="text-amber-700 text-sm whitespace-pre-wrap">{order.finishingInstructions}</p>
           </div>
        )}

        <div className="p-6 space-y-6">
          {batches.map((batch) => {
            const fData = batch.finishingData;
            if (!fData) return null;
            const isBatchReadOnly = isOrderReadOnly || fData.status === 'مكتمل';

            return (
              <div key={batch.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded shadow-sm">
                      باتش: {batch.batchNumber}
                    </span>
                    {fData.status === 'مكتمل' && (
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> معتمد
                      </span>
                    )}

                    {!isOrderReadOnly && batches.length > 1 && fData.status !== 'مكتمل' && (
                      <button
                        onClick={() => handleCopyDetails(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm ml-2"
                        title="نسخ تفاصيل التشطيب للباتشات المتبقية"
                      >
                        <Copy className="w-4 h-4" />
                        نسخ للباتشات
                      </button>
                    )}

                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">عامل التشطيب</label>
                      <select
                        value={fData.workerName || ""}
                        onChange={(e) => handleUpdateFinishingData(batch.id, 'workerName', e.target.value)}
                        disabled={isBatchReadOnly}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">اختر عامل التشطيب...</option>
                        
                        {Array.from(new Set(finishingWorkers.map(w => w.role || 'غير محدد'))).map(role => (
                          <optgroup key={role} label={role}>
                            {finishingWorkers.filter(w => (w.role || 'غير محدد') === role).map(w => (
                              <option key={w.id} value={w.name}>{w.name}</option>
                            ))}
                          </optgroup>
                        ))}

                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        تكلفة التشطيب الفعلية (للقطعة)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fData.actualCostPerPiece ?? ""}
                          onChange={(e) => { const v = parseFloat(e.target.value); handleUpdateFinishingData(batch.id, 'actualCostPerPiece', isNaN(v) ? undefined : v); }}
                          disabled={isBatchReadOnly}
                          className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                          placeholder="0.00"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">جنيه</span>
                      </div>
                    </div>
                  </div>

                                    <div>
                    <h5 className="font-bold text-slate-700 mb-3 text-md">الكميات الفعلية المصنعة السليمة:</h5>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-bold border-b">المقاس</th>
                          <th className="px-4 py-3 font-bold border-b">اللون</th>
                          <th className="px-4 py-3 font-bold border-b">الوارد من الخياطة</th>
                          <th className="px-4 py-3 font-bold border-b">السليم (التشطيب)</th>
                          <th className="px-4 py-3 font-bold border-b">النقص (الهالك)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                           let sewingTotal = 0;
                           let finishingTotal = 0;
                           let missingTotal = 0;
                           
                           const rows = (batch.sewingData?.actualQuantities || []).map(sq => {
                                 const currentFinishingQty = (fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color) as any)?.actualQuantity ?? (fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color) as any)?.quantity ?? sq.actualQuantity;
                                 const diff = sq.actualQuantity - currentFinishingQty;
                                 
                                 sewingTotal += sq.actualQuantity;
                                 finishingTotal += currentFinishingQty;
                                 missingTotal += diff;
                                 
                                 return (
                                    <tr key={`${sq.size}-${sq.color}`}>
                                       <td className="px-4 py-3 text-slate-600 font-medium">
                                          {sq.size}
                                       </td>
                                       <td className="px-4 py-3 text-slate-600 font-medium">
                                          {sq.color}
                                       </td>
                                       <td className="px-4 py-3 text-slate-600">
                                          {sq.actualQuantity}
                                       </td>
                                       <td className="px-4 py-3 w-48">
                                          <input 
                                             type="number"
                                             min="0"
                                             max={sq.actualQuantity}
                                             disabled={isBatchReadOnly}
                                             value={currentFinishingQty === 0 && !(fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color)) ? "" : currentFinishingQty}
                                             onChange={(e) => {
                                                let val = parseInt(e.target.value, 10);
                                                if (isNaN(val)) val = 0;
                                                if (val > sq.actualQuantity) val = sq.actualQuantity;
                                                handleVariantQuantityChange(batch.id, sq.size, sq.color, val);
                                             }}
                                             className="w-full px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                                             placeholder="0"
                                          />
                                       </td>
                                       <td className="px-4 py-3">
                                          {diff > 0 && (
                                            <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full text-xs">
                                              {diff}
                                            </span>
                                          )}
                                          {diff === 0 && currentFinishingQty > 0 && (
                                            <Check className="w-4 h-4 text-emerald-500 inline" />
                                          )}
                                       </td>
                                    </tr>
                                 );
                           });
                           
                           return (
                             <>
                               {rows}
                               <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                 <td colSpan={2} className="px-4 py-3 text-slate-800 text-left">الإجمالي</td>
                                 <td className="px-4 py-3 text-slate-800">{sewingTotal}</td>
                                 <td className="px-4 py-3 text-indigo-700">{finishingTotal}</td>
                                 <td className="px-4 py-3 text-amber-600">{missingTotal}</td>
                               </tr>
                             </>
                           );
                        })()}
                      </tbody>
                    </table>
                    </div>
                  </div>
                  
                  {!isBatchReadOnly && (
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => saveFinishing(batch.id, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
                      >
                        <Save className="w-4 h-4" />
                        حفظ
                      </button>
                      <button
                        onClick={() => saveFinishing(batch.id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        اعتماد الباتش
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Hidden Print Container */}
      <div className="hidden">
        {printing && (
          <FinishingWorkOrderPrint order={order} />
        )}
      </div>
    </div>
  );
};
