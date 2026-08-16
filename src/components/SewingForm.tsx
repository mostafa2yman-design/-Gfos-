import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, BatchItem, SewingData, SewingVariantData, SewingManufacturingType } from "../types";
import { getOrderById } from "../lib/storage";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Scissors, Printer } from "lucide-react";
import { SewingWorkOrder } from './workorders/SewingWorkOrder';
import { eventBus } from "../lib/events/eventBus";

interface Props {
  orderId: string;
  onSaved: () => void;
}

export const SewingForm: React.FC<Props> = ({ orderId, onSaved }) => {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: "success" | "error"; } | null>(null);
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = () => {
    const o = getOrderById(orderId);
    if (o) {
      setOrder(o);
      setBatches(
        o.batches?.map((b) => ({
          ...b,
          sewingData: b.sewingData || {
            status: "لم يبدأ",
            actualQuantities: [],
          },
        })) || []
      );
    }
  };

  if (!order) return null;

  const isReadOnly = ["مسودة", "أمر إنتاج معتمد", "أمر قص", "القص الفعلي مدخل", "القص معتمد", "تقسيم الباتشات", "الباتشات مثبتة", "التجهيز جاري", "التجهيز مكتمل", "الطباعة والتطريز جاري", "الخياطة مكتملة", "مغلق"].includes(order.status);

  const handleSewingChange = (
    batchId: string,
    field: keyof SewingData,
    value: any
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            sewingData: {
              ...b.sewingData!,
              [field]: value,
            },
          };
        }
        return b;
      })
    );
  };

  const handleActualQtyChange = (
    batchId: string,
    size: string,
    color: string,
    qty: number
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          const sData = b.sewingData!;
          const existing = sData.actualQuantities;
          const index = existing.findIndex((v) => v.size === size && v.color === color);
          let newQuantities = [...existing];
          if (index >= 0) {
            newQuantities[index].actualQuantity = qty;
          } else {
            newQuantities.push({ size, color, actualQuantity: qty });
          }
          return {
            ...b,
            sewingData: {
              ...sData,
              actualQuantities: newQuantities,
            },
          };
        }
        return b;
      })
    );
  };

  const handleSave = () => {
    const result = Cmd.saveSewingData(order, batches);
    if (result.success && result.data) {
      setOrder(result.data);
      setToastConfig({
        message: "تم حفظ بيانات الخياطة بنجاح",
        type: "success",
      });
      if (onSaved) onSaved();
    } else {
      setToastConfig({
        message: result.error || "حدث خطأ أثناء الحفظ",
        type: "error",
      });
    }
  };

  const handleApprove = () => {
    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من اعتماد الخياطة؟ لا يمكن تعديل البيانات بعد الاعتماد.",
      onConfirm: () => {
        const saveResult = Cmd.saveSewingData(order, batches);
        if (saveResult.success && saveResult.data) {
          const approveResult = Cmd.approveSewing(saveResult.data);
          if (approveResult.success && approveResult.data) {
            setOrder(approveResult.data);
            setToastConfig({
              message: "تم اعتماد الخياطة بنجاح",
              type: "success",
            });
            if (onSaved) onSaved();
          } else {
            setToastConfig({
              message: approveResult.error || "حدث خطأ أثناء الاعتماد",
              type: "error",
            });
          }
        } else {
           setToastConfig({
              message: saveResult.error || "حدث خطأ أثناء الحفظ",
              type: "error",
            });
        }
        setConfirmConfig(null);
      },
    });
  };

  return (
    <>
    <div className={`space-y-6 print:hidden ${printingBatchId ? 'hidden' : ''}`}>
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title="تأكيد الاعتماد"
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {batches.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
          لا توجد باتشات في هذا الأمر.
        </div>
      ) : (
        <>
          {batches.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">ملخص أمر الخياطة</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-bold border-b">باتش</th>
                      <th className="px-4 py-3 font-bold border-b">طريقة التصنيع</th>
                      <th className="px-4 py-3 font-bold border-b">الجهة / المجموعة</th>
                      <th className="px-4 py-3 font-bold border-b text-center">المطلوب</th>
                      <th className="px-4 py-3 font-bold border-b text-center">الفعلي</th>
                      <th className="px-4 py-3 font-bold border-b text-center">النقص</th>
                      <th className="px-4 py-3 font-bold border-b text-center">السعر / قطعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map(batch => {
                      const sData = batch.sewingData!;
                      let bReq = 0;
                      let bAct = 0;
                      batch.sizes.forEach(bs => bs.variants.forEach(v => bReq += v.quantity));
                      sData.actualQuantities.forEach(v => bAct += (v.actualQuantity || 0));
                      const bMiss = bReq - bAct;
                      const method = sData.manufacturingType || "—";
                      const group = sData.manufacturingType === "تصنيع داخلي" 
                                      ? (sData.sewingGroup || "—") 
                                      : (sData.manufacturingType === "تصنيع خارجي" 
                                          ? (sData.externalManufacturer || "—") 
                                          : "—");
                      const price = sData.actualCostPerPiece !== undefined ? Number(sData.actualCostPerPiece).toFixed(2) : "—";
                      
                      return (
                        <tr key={batch.id}>
                          <td className="px-4 py-3 font-bold">{batch.batchNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{method}</td>
                          <td className="px-4 py-3 text-slate-600">{group}</td>
                          <td className="px-4 py-3 text-center">{bReq}</td>
                          <td className="px-4 py-3 text-center text-indigo-700 font-bold">{bAct}</td>
                          <td className="px-4 py-3 text-center text-amber-600 font-bold">{bMiss > 0 ? bMiss : "—"}</td>
                          <td className="px-4 py-3 text-center text-emerald-700 font-bold">{price}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {batches.map((batch) => {
            const sData = batch.sewingData!;
          let requiredTotal = 0;
          let actualTotal = 0;
          batch.sizes.forEach(bs => {
            bs.variants.forEach(v => {
              requiredTotal += v.quantity;
            });
          });
          sData.actualQuantities.forEach(v => {
             actualTotal += (v.actualQuantity || 0);
          });
          
          let completionRatio = requiredTotal > 0 ? (actualTotal / requiredTotal) * 100 : 0;
          const missing = requiredTotal - actualTotal;

          return (
            <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-4">
                  باتش: {batch.batchNumber}
                  <button 
                    onClick={() => handlePrint(batch.id)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة الإيصال
                  </button>
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-slate-500 ml-2">نسبة التنفيذ:</span>
                    <span className={`font-bold ${completionRatio >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Number(completionRatio).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-sm bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <span className="text-slate-500 ml-1">المطلوب:</span>
                    <span className="font-bold">{requiredTotal}</span>
                    <span className="text-slate-500 mx-2">|</span>
                    <span className="text-slate-500 ml-1">الفعلي:</span>
                    <span className="font-bold">{actualTotal}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      طريقة التصنيع <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={sData.manufacturingType || ""}
                      onChange={(e) => handleSewingChange(batch.id, "manufacturingType", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" disabled>اختر الطريقة...</option>
                      <option value="تصنيع داخلي">تصنيع داخلي</option>
                      <option value="تصنيع خارجي">تصنيع خارجي</option>
                    </select>
                  </div>

                  {sData.manufacturingType === "تصنيع داخلي" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        مجموعة الخياطة المسؤولة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sData.sewingGroup || ""}
                        onChange={(e) => handleSewingChange(batch.id, "sewingGroup", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="أدخل اسم/رقم المجموعة"
                      />
                    </div>
                  )}

                  {sData.manufacturingType === "تصنيع خارجي" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        جهة التصنيع الخارجي <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sData.externalManufacturer || ""}
                        onChange={(e) => handleSewingChange(batch.id, "externalManufacturer", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="أدخل اسم الجهة الخارجية"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      سعر التصنيع الفعلي / قطعة <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sData.actualCostPerPiece === undefined ? "" : sData.actualCostPerPiece}
                        onChange={(e) => handleSewingChange(batch.id, "actualCostPerPiece", e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        جنيه
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-bold text-slate-700 mb-4">
                    الكميات الفعلية المصنعة
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-bold border-b">المقاس</th>
                          <th className="px-4 py-3 font-bold border-b">اللون</th>
                          <th className="px-4 py-3 font-bold border-b">المطلوب</th>
                          <th className="px-4 py-3 font-bold border-b">الفعلي المصنع</th>
                          <th className="px-4 py-3 font-bold border-b">النقص</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batch.sizes.map((bs) =>
                          bs.variants.map((v) => {
                            const actQtyData = sData.actualQuantities.find(
                              (aq) => aq.size === bs.size && aq.color === v.color
                            );
                            const actQty = actQtyData ? actQtyData.actualQuantity : 0;
                            const diff = v.quantity - actQty;

                            return (
                              <tr key={`${bs.size}-${v.color}`}>
                                <td className="px-4 py-3 text-slate-600 font-medium">
                                  {bs.size}
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium">
                                  {v.color}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {v.quantity}
                                </td>
                                <td className="px-4 py-3 w-48">
                                  <input
                                    type="number"
                                    min="0"
                                    max={v.quantity}
                                    value={actQty === 0 && !actQtyData ? "" : actQty}
                                    onChange={(e) => {
                                      let val = parseInt(e.target.value) || 0;
                                      if (val > v.quantity) val = v.quantity;
                                      handleActualQtyChange(batch.id, bs.size, v.color, val);
                                    }}
                                    disabled={isReadOnly}
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
                                  {diff === 0 && actQtyData && (
                                    <Check className="w-4 h-4 text-emerald-500 inline" />
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                          <td colSpan={2} className="px-4 py-3 text-slate-800 text-left">الإجمالي</td>
                          <td className="px-4 py-3 text-slate-800">{requiredTotal}</td>
                          <td className="px-4 py-3 text-indigo-700">{actualTotal}</td>
                          <td className="px-4 py-3 text-amber-600">{missing}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {missing > 0 && actualTotal > 0 && (
                    <p className="text-amber-600 text-sm mt-3 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
                       يوجد نقص إجمالي {missing} قطعة عن الكمية المطلوبة في هذا الباتش.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })
        }
        </>
      )}

      {!isReadOnly && batches.length > 0 && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium shadow-sm"
          >
            <Save className="w-5 h-5" />
            حفظ مؤقت
          </button>
          <button
            onClick={handleApprove}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-sm"
          >
            <Check className="w-5 h-5" />
            اعتماد الخياطة
          </button>
        </div>
      )}
    </div>
    
      {printingBatchId && (
        <div className="print:block hidden print:absolute print:inset-0">
          <SewingWorkOrder order={order} batch={order.batches.find(b => b.id === printingBatchId)!} />
        </div>
      )}
    </>
  );
};
