import React, { useState, useEffect } from 'react';
import { ProductionOrder, BatchItem, BatchSplitMethod, BatchSizeData, BatchVariant } from '../types';
import { getOrderById } from '../lib/storage';
import * as Cmd from '../lib/productionOrderCommands';
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Plus, Trash2 } from 'lucide-react';

interface BatchesFormProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function BatchesForm({ orderId, onSaved }: BatchesFormProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [toastConfig, setToastConfig] = useState<{message: string, type: "success" | "error" | "info"} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  useEffect(() => {
    const load = async () => {
      const found = await getOrderById(orderId);
      if (found) setOrder(found);
    };
    load();
  }, [orderId]);

  if (!order) return <div>جاري التحميل...</div>;

  const isReadOnly = ["مسودة", "أمر إنتاج معتمد", "أمر قص", "القص الفعلي مدخل", "الباتشات مثبتة", "التجهيز جاري", "التجهيز مكتمل", "الطباعة والتطريز جاري", "الطباعة والتطريز مكتمل", "الخياطة مكتملة", "مغلق"].includes(order.status);
  
  const batches = order.batches || [];
  
  let totalActual = 0;
  if (order.cutData) {
    order.cutData.sizes.forEach(s => s.variants.forEach(v => totalActual += (v.actualQuantity || 0)));
  }
  
  let totalBatches = 0;
  batches.forEach(b => b.sizes.forEach(s => s.variants.forEach(v => totalBatches += v.quantity)));

  const handleSplitMethodChange = async (method: BatchSplitMethod) => {
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
    
    const result = await Cmd.saveBatches(order, newBatches, method);
    if (result.success) {
      if (result.data) setOrder(result.data);
    } else {
      setError(result.error || "حدث خطأ");
    }
  };

  const handleLockBatches = async () => {
    if (isReadOnly) return;
    if (totalBatches !== totalActual) {
      setToastConfig({ message: "لا يمكن التثبيت: إجمالي الباتشات لا يساوي إجمالي القص الفعلي.", type: "error" });
      return;
    }
    setConfirmConfig({
      isOpen: true,
      message: "بعد تثبيت الباتشات لن يمكن تعديل توزيع الكميات. هل أنت متأكد؟",
      onConfirm: async () => {
        const result = await Cmd.lockBatches(order);
        if (result.success) {
          setConfirmConfig(null);
          onSaved();
        } else {
          setConfirmConfig(null);
          setToastConfig({ message: result.error || "حدث خطأ", type: "error" });
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const statusColor = totalBatches === totalActual ? 'text-emerald-600' : totalBatches < totalActual ? 'text-amber-500' : 'text-red-500';
  const statusMessage = totalBatches === totalActual ? 'التوزيع مكتمل' : totalBatches < totalActual ? 'توجد كمية غير موزعة' : 'التوزيع يتجاوز الكمية المقصوصة';

  return (
    <>
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {toastConfig && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig(null)} />}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

    <div className="space-y-6 p-6">
      {(isReadOnly || order.batchesLockedAt) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  تم اعتماد وتثبيت تقسيم الباتشات بنجاح
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  معتمد ومثبت
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {order.batchesLockedBy ? `بواسطة: ${order.batchesLockedBy}` : ''}
                {order.batchesLockedAt ? ` • بتاريخ: ${new Date(order.batchesLockedAt).toLocaleString('ar-EG')}` : ''}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg">
            تم قفل توزيع الباتشات وتثبيتها للتشغيل
          </span>
        </div>
      )}

      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800">تقسيم الباتشات</h3>
          <p className="text-sm text-slate-500">توزيع القص الفعلي على دفعات تشغيل</p>
        </div>
        <div className="flex gap-3">
          {!isReadOnly ? (
            <button
              onClick={handleLockBatches}
              disabled={totalBatches !== totalActual}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm ${
                totalBatches === totalActual ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              اعتماد الباتشات
            </button>
          ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg shadow-sm font-medium text-sm">
                <Check className="w-4 h-4" />
                تم الاعتماد
             </div>
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
        {batches.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-bold border-b">رقم الباتش</th>
                    <th className="px-4 py-3 font-bold border-b">المقاس</th>
                    <th className="px-4 py-3 font-bold border-b">اللون</th>
                    <th className="px-4 py-3 font-bold border-b text-center">المطلوب</th>
                    <th className="px-4 py-3 font-bold border-b text-center">حالة القص</th>
                    <th className="px-4 py-3 font-bold border-b text-center">حالة الطباعة</th>
                    <th className="px-4 py-3 font-bold border-b text-center">حالة الخياطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map(batch => {
                    const printStatus = batch.printEmbroideryStatus || 'لم يبدأ';
                    const sewStatus = batch.sewingData?.status || 'لم يبدأ';
                    const prepStatus = batch.prepStatus || 'لم يبدأ';
                    
                    return batch.sizes.map((size) => (
                      <React.Fragment key={`${batch.id}-${size.size}`}>
                        {size.variants.map((variant, vIdx) => (
                          <tr key={`${batch.id}-${size.size}-${variant.color}`}>
                            <td className="px-4 py-2 font-bold text-slate-800">{batch.batchNumber}</td>
                            <td className="px-4 py-2 text-slate-700">{size.size}</td>
                            <td className="px-4 py-2 text-slate-600">{variant.color}</td>
                            <td className="px-4 py-2 text-center font-bold text-indigo-600">{variant.quantity}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs">مكتمل</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                printStatus === 'مكتمل' ? 'bg-emerald-50 text-emerald-700' :
                                printStatus === 'جاري' ? 'bg-amber-50 text-amber-700' :
                                printStatus === 'تم التخطي' ? 'bg-slate-100 text-slate-600' :
                                'bg-slate-100 text-slate-500'
                              }`}>{printStatus}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                sewStatus === 'مكتمل' ? 'bg-emerald-50 text-emerald-700' :
                                sewStatus === 'جاري' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>{sewStatus}</span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">لم يتم إنشاء أي باتشات بعد</p>
            <p className="text-slate-400 text-sm mt-1">اختر طريقة التقسيم التلقائي للبدء</p>
          </div>
        )}
      </div>

      {/* Bottom Approval & Control Bar */}
      {batches.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">حالة اعتماد الباتشات:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              (isReadOnly || order.batchesLockedAt)
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {(isReadOnly || order.batchesLockedAt) ? 'البـاتشات معتمدة ومثبتة' : 'قيد التوزيع والتعديل'}
            </span>
            <span className="text-xs text-slate-500">
              ({batches.length} باتش بإجمالي {totalBatches} قطعة من أصل {totalActual} مقصوصة)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(isReadOnly || order.batchesLockedAt) ? (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg shadow-xs font-bold text-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
                تم اعتماد وتثبيت الباتشات بالكامل
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLockBatches}
                disabled={totalBatches !== totalActual}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors font-bold shadow-sm text-sm cursor-pointer ${
                  totalBatches === totalActual
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                اعتماد وتثبيت الباتشات
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
