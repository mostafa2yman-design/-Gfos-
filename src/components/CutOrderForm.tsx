import React, { useState, useEffect, useRef } from "react";
import {
  ProductionOrder,
  CutOrderData,
  CutSizeData,
  CutVariant,
} from "../types";
import { getOrderById } from "../lib/storage";
import { useReactToPrint } from "react-to-print";
import { CutWorkOrderPrint } from "./print/CutWorkOrderPrint";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Printer } from "lucide-react";
import { calculateFabricAnalysis } from "../lib/fabricUtils";
import { FabricSummary } from "./FabricSummary";

interface CutOrderFormProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function CutOrderForm({ orderId, onSaved }: CutOrderFormProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printRef });
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cutData, setCutData] = useState<CutOrderData | null>(null);

  useEffect(() => {
    const found = getOrderById(orderId);
    if (found) {
      setOrder(found);
      if (found.cutData) {
        setCutData(found.cutData);
      } else {
        // Initialize cut data from production sizes
        setCutData({
          sizes: found.sizes.map((s) => ({
            size: s.size,
            variants: s.variants.map((v) => ({
              color: v.color,
              plannedQuantity: v.quantity,
              actualQuantity: v.quantity, // default to planned
            })),
          })),
        });
      }
    }
  }, [orderId]);

  if (!order || !cutData) return <div>جاري التحميل...</div>;

  const isReadOnly = order.status === "مسودة" || ["القص معتمد", "تقسيم الباتشات", "الباتشات مثبتة", "التجهيز جاري", "التجهيز مكتمل", "الطباعة والتطريز جاري", "الطباعة والتطريز مكتمل", "الخياطة مكتملة", "مغلق"].includes(order.status);

  const handleWeightChange = (color: string, value: number) => {
    if (isReadOnly) return;
    setCutData((prev) => {
      if (!prev) return prev;

      const newByColor = {
        ...(prev.actualWeightByColor || {}),
        [color]: value,
      };

      const totalActualWeight = Object.values(newByColor).reduce(
        (acc: number, curr: number) => acc + (curr || 0),
        0,
      );

      return {
        ...prev,
        actualWeightByColor: newByColor,
        actualWeight: totalActualWeight,
      };
    });
  };
  const handleVariantChange = (
    sizeIndex: number,
    variantIndex: number,
    value: number,
  ) => {
    if (isReadOnly) return;
    const newSizes = [...cutData.sizes];
    newSizes[sizeIndex] = {
      ...newSizes[sizeIndex],
      variants: [...newSizes[sizeIndex].variants],
    };
    newSizes[sizeIndex].variants[variantIndex] = {
      ...newSizes[sizeIndex].variants[variantIndex],
      actualQuantity: value,
    };
    setCutData({ ...cutData, sizes: newSizes });
  };

  const handleSaveDraft = () => {
    if (isReadOnly) return;
    const result = Cmd.saveCutData(order, cutData);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error || "حدث خطأ");
    }
  };

  const handleApproveCut = () => {
    if (!order) return;
    if (isReadOnly) return;
    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من اعتماد أمر القص؟ لن تتمكن من تعديل كميات القص أو البيانات الأساسية بعد الاعتماد.",
      onConfirm: () => {
        const result = Cmd.approveCutOrder(order, cutData);
        if (result.success) {
          setConfirmConfig(null);
          onSaved();
        } else {
          setConfirmConfig(null);
          setError(result.error || "حدث خطأ");
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const fabricSummary = calculateFabricAnalysis(order, cutData);
  const colors = Array.from(
    new Set(cutData.sizes.flatMap((s) => s.variants.map((v) => v.color))),
  );
  let totalPlanned = 0;
  let totalActual = 0;

  cutData.sizes.forEach((s) => {
    s.variants.forEach((v) => {
      totalPlanned += v.plannedQuantity;
      totalActual += v.actualQuantity || 0;
    });
  });

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            إدخال القص الفعلي
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            قارن الكميات المخططة بالكميات الفعلية بعد القص
          </p>
        </div>
        <div className="flex gap-3">
          {isReadOnly ? (
            <div className="flex gap-2">
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium border border-emerald-200 flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4" />
                  القص معتمد
                </div>
                <button
                  onClick={() => reactToPrintFn()}
                  className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
                >
                  <Printer className="w-4 h-4" />
                  طباعة أمر التشغيل
                </button>
              </div>
          ) : (
            <>
              <button
                onClick={() => reactToPrintFn()}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة أمر التشغيل
              </button>
              <button onClick={handleSaveDraft}
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
          <p className="text-sm text-slate-500 mb-1">نسبة الهالك / الزيادة</p>
          <p
            className={`text-2xl font-bold ${totalActual < totalPlanned ? "text-red-500" : totalActual > totalPlanned ? "text-emerald-500" : "text-slate-800"}`}
          >
            {totalPlanned > 0
              ? (((totalActual - totalPlanned) / totalPlanned) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">
                  المقاس
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  اللون
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">
                  المخطط
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">
                  القص الفعلي
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cutData.sizes.map((size, sIdx) => (
                <React.Fragment key={size.size}>
                  {size.variants.map((variant, vIdx) => (
                    <tr
                      key={`${size.size}-${variant.color}`}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {vIdx === 0 && (
                        <td
                          className="px-6 py-4 font-bold text-slate-800 border-l border-slate-100"
                          rowSpan={size.variants.length}
                        >
                          {size.size}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-700">
                          {variant.color}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold min-w-[3rem]">
                          {variant.plannedQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center w-48">
                        <input
                          type="number"
                          min="0"
                          value={variant.actualQuantity || ""}
                          onChange={(e) =>
                            handleVariantChange(
                              sIdx,
                              vIdx,
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          disabled={isReadOnly}
                          className={`w-full px-3 py-2 border rounded text-sm text-center font-bold ${
                            isReadOnly
                              ? "bg-slate-50 text-slate-700"
                              : "bg-white focus:ring-2 focus:ring-indigo-500 text-indigo-700"
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
      {fabricSummary && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h4 className="text-md font-bold text-slate-800 mb-4">
              الوزن الفعلي المسحوب لكل لون (كجم)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colors.map((color: string) => (
                <div key={color}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {color}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={cutData.actualWeightByColor?.[color] || ""}
                    onChange={(e) =>
                      handleWeightChange(color, parseFloat(e.target.value) || 0)
                    }
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded text-sm ${isReadOnly ? "bg-slate-50 text-slate-700" : "bg-white focus:ring-2 focus:ring-indigo-500"}`}
                    placeholder="الوزن الفعلي"
                  />
                </div>
              ))}
            </div>
          </div>

          <FabricSummary summary={fabricSummary} />
        </div>
      )}
      <div className="hidden">
        <CutWorkOrderPrint ref={printRef} order={order} />
      </div>
    </div>
  );
}
