import React, { useState, useEffect } from "react";
import {
  ProductionOrder,
  BatchItem,
  PrintEmbroideryExecutionType,
  PrintDetails,
  EmbroideryDetails,
} from "../types";
import { getOrderById } from "../lib/storage";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Printer, Copy } from "lucide-react";
import { PrintEmbroideryWorkOrder } from "./workorders/PrintEmbroideryWorkOrder";

interface Props {
  orderId: string;
  onSaved: () => void;
}

export const PrintEmbroideryForm: React.FC<Props> = ({ orderId, onSaved }) => {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const found = await getOrderById(orderId);
      if (found) {
        setOrder(found);
        setBatches(found.batches || []);
      }
    };
    loadData();
  }, [orderId]);

  if (!order)
    return (
      <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
    );

  const isReadOnly = ["الطباعة والتطريز مكتمل", "مغلق"].includes(order.status);

  const handleExecutionTypeChange = (
    batchId: string,
    type: PrintEmbroideryExecutionType,
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            executionType: type,
            printDetails:
              type === "طباعة" || type === "طباعة + تطريز"
                ? b.printDetails || {
                    designName: "",
                    placement: "",
                    colors: "",
                    colorCount: 1,
                    notes: "",
                  }
                : undefined,
            embroideryDetails:
              type === "تطريز" || type === "طباعة + تطريز"
                ? b.embroideryDetails || {
                    designName: "",
                    placement: "",
                    threadColors: "",
                    colorCount: 1,
                    notes: "",
                  }
                : undefined,
          };
        }
        return b;
      }),
    );
  };


  const handleCopyDetails = async (sourceBatchId: string) => {
    const sourceBatch = batches.find(b => b.id === sourceBatchId);
    if (!sourceBatch) return;

    const updatedBatches = batches.map(b => {
      if (b.id === sourceBatchId) return b;
      return {
        ...b,
        executionType: sourceBatch.executionType,
        printDetails: sourceBatch.printDetails ? { ...sourceBatch.printDetails } : undefined,
        embroideryDetails: sourceBatch.embroideryDetails ? { ...sourceBatch.embroideryDetails } : undefined,
        printEmbroideryCost: sourceBatch.printEmbroideryCost ? { ...sourceBatch.printEmbroideryCost } : undefined
      };
    });
    setBatches(updatedBatches);
    setToastConfig({ message: "تم نسخ تفاصيل الطباعة والتطريز لجميع الباتشات بنجاح", type: "success" });
  };

  const handleCostChange = (
    batchId: string,
    field: "standardCost" | "actualCost",
    value: number,
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            printEmbroideryCost: {
              ...b.printEmbroideryCost,
              standardCost: b.printEmbroideryCost?.standardCost || 0,
              [field]: value,
            },
          };
        }
        return b;
      }),
    );
  };

  const handlePrintChange = (
    batchId: string,
    field: keyof PrintDetails,
    value: string | number,
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId && b.printDetails) {
          return { ...b, printDetails: { ...b.printDetails, [field]: value } };
        }
        return b;
      }),
    );
  };

  const handleEmbroideryChange = (
    batchId: string,
    field: keyof EmbroideryDetails,
    value: string | number,
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId && b.embroideryDetails) {
          return {
            ...b,
            embroideryDetails: { ...b.embroideryDetails, [field]: value },
          };
        }
        return b;
      }),
    );
  };

  const handlePrintBatch = async (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };

  const handleSaveDraft = async () => {
    const result = await Cmd.savePrintEmbroideryData(order, batches);
    if (result.success) {
      setToastConfig({
        message: "تم حفظ البيانات كمسودة بنجاح.",
        type: "success",
      });
      onSaved();
    } else {
      setToastConfig({
        message: result.error || "حدث خطأ أثناء الحفظ.",
        type: "error",
      });
    }
  };

  const handleApprove = async () => {
    // Validate
    const invalidBatch = batches.find((b) => {
      if (!b.executionType) return true;
      if (b.executionType === "طباعة" || b.executionType === "طباعة + تطريز") {
        if (!b.printDetails?.designName || !b.printDetails?.placement)
          return true;
      }
      if (b.executionType === "تطريز" || b.executionType === "طباعة + تطريز") {
        if (!b.embroideryDetails?.designName || !b.embroideryDetails?.placement)
          return true;
      }
      return false;
    });

    if (invalidBatch) {
      setToastConfig({
        message: `بيانات الباتش ${invalidBatch.batchNumber} غير مكتملة. يرجى إدخال التفاصيل المطلوبة.`,
        type: "error",
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من اعتماد بيانات الطباعة والتطريز؟ لن تتمكن من تعديلها لاحقاً.",
      onConfirm: async () => {
        const orderToApprove = { ...order, batches };
        const saveResult = await Cmd.savePrintEmbroideryData(orderToApprove, batches);
        if (!saveResult.success || !saveResult.data) {
          setConfirmConfig(null);
          setToastConfig({
            message: saveResult.error || "حدث خطأ أثناء حفظ البيانات قبل الاعتماد.",
            type: "error",
          });
          return;
        }
        
        const result = await Cmd.approvePrintEmbroidery(saveResult.data);
        if (result.success) {
          setConfirmConfig(null);
          setToastConfig({
            message: "تم اعتماد المرحلة بنجاح.",
            type: "success",
          });
          onSaved();
        } else {
          setConfirmConfig(null);
          setToastConfig({
            message: result.error || "حدث خطأ.",
            type: "error",
          });
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const printDocument = (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };

  return (
    <>
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              مرحلة الطباعة والتطريز
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              تحديد نوع التنفيذ ومواصفاته لكل باتش
            </p>
          </div>
          <div className="flex flex-wrap gap-3">

                        {!isReadOnly && (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center justify-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
                >
                  <Check className="w-4 h-4" />
                  اعتماد
                </button>
              </>
            )}
            {isReadOnly && (
                <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex-1 md:flex-none">
                  <Check className="w-4 h-4" />
                  تم الاعتماد
                </div>
            )}
          </div>
        </div>

        <div className="relative">
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
          {batches.map((batch) => {
            let totalQuantity = 0;
            batch.sizes.forEach((s) =>
              s.variants.forEach((v) => (totalQuantity += v.quantity)),
            );

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      {batch.batchNumber}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      إجمالي الكمية: {totalQuantity} قطعة
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      نوع التنفيذ:
                    </span>
                    <select
                      value={batch.executionType || ""}
                      onChange={(e) =>
                        handleExecutionTypeChange(
                          batch.id,
                          e.target.value as PrintEmbroideryExecutionType,
                        )
                      }
                      disabled={isReadOnly}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                    >
                      <option value="" disabled>
                        اختر التنفيذ...
                      </option>
                      <option value="بدون طباعة / تطريز">
                        بدون طباعة / تطريز
                      </option>
                      <option value="طباعة">طباعة</option>
                      <option value="تطريز">تطريز</option>
                      <option value="طباعة + تطريز">طباعة + تطريز</option>
                    </select>
                    <button
                      onClick={() => handlePrintBatch(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة أمر الطباعة
                    </button>
                    {!isReadOnly && batches.length > 1 && (
                      <button
                        onClick={() => handleCopyDetails(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                        title="نسخ تفاصيل الطباعة والتطريز للباتشات المتبقية"
                      >
                        <Copy className="w-4 h-4" />
                        نسخ للباتشات
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Sizes display */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    {batch.sizes.map((s) => (
                      <div
                        key={s.size}
                        className="bg-slate-100 border border-slate-200 rounded px-3 py-2 flex items-center gap-2"
                      >
                        <span className="font-bold text-slate-700">
                          {s.size}:
                        </span>
                        <div className="flex gap-2">
                          {s.variants.map((v) => (
                            <span
                              key={v.color}
                              className="text-slate-600 bg-white px-2 py-0.5 rounded border shadow-sm"
                            >
                              {v.color}{" "}
                              <span className="font-bold text-indigo-600">
                                ({v.quantity})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {batch.executionType &&
                    batch.executionType !== "بدون طباعة / تطريز" && (
                      <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 mt-4">
                        <h5 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          تكلفة الطباعة / التطريز
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              التكلفة المعيارية للقطعة (محددة في الخامات)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={order.printEmbroideryStandardCost || 0}
                                disabled
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed outline-none"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                جنيه
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              التكلفة الفعلية للقطعة
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  batch.printEmbroideryCost?.actualCost || ""
                                }
                                onChange={(e) =>
                                  handleCostChange(
                                    batch.id,
                                    "actualCost",
                                    (() => { const v = parseFloat(e.target.value); return isNaN(v) ? 0 : v; })(),
                                  )
                                }
                                disabled={isReadOnly}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                                placeholder="0.00 (تترك فارغة إذا لم تكتمل)"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                جنيه
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Print Details */}
                  {(batch.executionType === "طباعة" ||
                    batch.executionType === "طباعة + تطريز") && (
                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                      <h5 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        مواصفات الطباعة
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            شكل / تصميم الطباعة{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={batch.printDetails?.designName || ""}
                            onChange={(e) =>
                              handlePrintChange(
                                batch.id,
                                "designName",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            placeholder="أدخل اسم أو وصف التصميم..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            مكان الطباعة <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={batch.printDetails?.placement || ""}
                            onChange={(e) =>
                              handlePrintChange(
                                batch.id,
                                "placement",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            placeholder="مثال: الصدر، الظهر..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ألوان الطباعة
                          </label>
                          <input
                            type="text"
                            value={batch.printDetails?.colors || ""}
                            onChange={(e) =>
                              handlePrintChange(
                                batch.id,
                                "colors",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            placeholder="مثال: أبيض، أحمر..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            عدد ألوان الطباعة
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={batch.printDetails?.colorCount || 1}
                            onChange={(e) =>
                              handlePrintChange(
                                batch.id,
                                "colorCount",
                                (() => { const v = parseInt(e.target.value, 10); return isNaN(v) ? 1 : v; })(),
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ملاحظات الطباعة
                          </label>
                          <textarea
                            value={batch.printDetails?.notes || ""}
                            onChange={(e) =>
                              handlePrintChange(
                                batch.id,
                                "notes",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            rows={2}
                            placeholder="أي ملاحظات إضافية للفني..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Embroidery Details */}
                  {(batch.executionType === "تطريز" ||
                    batch.executionType === "طباعة + تطريز") && (
                    <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                      <h5 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        مواصفات التطريز
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            شكل / تصميم التطريز{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={batch.embroideryDetails?.designName || ""}
                            onChange={(e) =>
                              handleEmbroideryChange(
                                batch.id,
                                "designName",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                            placeholder="أدخل اسم أو وصف التطريز..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            مكان التطريز <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={batch.embroideryDetails?.placement || ""}
                            onChange={(e) =>
                              handleEmbroideryChange(
                                batch.id,
                                "placement",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                            placeholder="مثال: الصدر الأيسر..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ألوان الخيوط
                          </label>
                          <input
                            type="text"
                            value={batch.embroideryDetails?.threadColors || ""}
                            onChange={(e) =>
                              handleEmbroideryChange(
                                batch.id,
                                "threadColors",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                            placeholder="مثال: ذهبي، أسود..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            عدد ألوان الخيوط
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={batch.embroideryDetails?.colorCount || 1}
                            onChange={(e) =>
                              handleEmbroideryChange(
                                batch.id,
                                "colorCount",
                                (() => { const v = parseInt(e.target.value, 10); return isNaN(v) ? 1 : v; })(),
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ملاحظات التطريز
                          </label>
                          <textarea
                            value={batch.embroideryDetails?.notes || ""}
                            onChange={(e) =>
                              handleEmbroideryChange(
                                batch.id,
                                "notes",
                                e.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                            rows={2}
                            placeholder="أي ملاحظات إضافية للفني..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  {!batch.executionType && (
                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      الرجاء اختيار نوع التنفيذ أعلاه
                    </div>
                  )}
                  {batch.executionType === "بدون طباعة / تطريز" && (
                    <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                      لا يتطلب هذا الباتش أي طباعة أو تطريز وسيتم تمريره مباشرة
                      لمرحلة الخياطة
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      {printingBatchId && (
        <div className="hidden print:block print:absolute print:inset-0">
        <PrintEmbroideryWorkOrder order={order} batch={batches.find((b) => b.id === printingBatchId)!} />
        </div>
      )}
    </>
  );
};
