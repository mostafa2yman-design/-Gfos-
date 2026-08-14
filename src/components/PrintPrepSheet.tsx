import React, { useState, useEffect } from "react";
import { ProductionOrder, BatchItem, AccessoryPrepItem } from "../types";
import { getOrderById } from "../lib/storage";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Printer, Check, CheckSquare, Square } from "lucide-react";
import { calculateBatchAccessories } from "../lib/prepUtils";
import { BatchPreparationWorkOrder } from "./BatchPreparationWorkOrder";

interface PrintPrepSheetProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function PrintPrepSheet({ orderId, onSaved }: PrintPrepSheetProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);

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
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);

  useEffect(() => {
    const found = getOrderById(orderId);
    if (found) {
      if (
        found.batches &&
        found.batches.length > 0 &&
        found.accessories &&
        found.accessories.length > 0
      ) {
        let needsSave = false;

        const updatedBatches = found.batches.map((batch) => {
          if (!batch.accessoriesPrep || batch.accessoriesPrep.length === 0) {
            needsSave = true;
            return {
              ...batch,
              accessoriesPrep: found.accessories.map((acc) => ({
                accessoryName: acc.name,
                accessoryId: acc.id,
                unit: acc.unit,
                requiredQuantity: 1, // maintained for structural compatibility
                actualPrepared: 0,
                waste: 0,
                isPrepared: false,
                notes: "",
              })),
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

  if (!order || !order.batches || order.batches.length === 0)
    return <div>لا توجد بيانات باتشات.</div>;

  const handlePrint = (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };

  const handleToggleAccessory = (batchId: string, accessoryName: string) => {
    const updatedBatches = order.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map((a) =>
            a.accessoryName === accessoryName
              ? { ...a, isPrepared: !a.isPrepared }
              : a,
          ),
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
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من اعتماد التجهيز لهذا الباتش؟",
      onConfirm: () => {
        const result = Cmd.approveBatchPrep(order, batchId);
        if (result.success && result.data) {
          setConfirmConfig(null);
          setOrder(result.data);
          onSaved();
        } else {
          setConfirmConfig(null);
          setToastConfig({ message: result.error || "حدث خطأ", type: "error" });
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  return (
    <>
      <div
        className={`space-y-8 p-6 print:hidden ${printingBatchId ? "hidden" : ""}`}
      >
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

        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              أوراق التجهيز والطباعة
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              متابعة تجهيز الإكسسوارات لكل باتش تشغيل
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {order.batches.map((batch) => {
            const allPrepared =
              batch.accessoriesPrep?.every((a) => a.isPrepared) || false;

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm break-inside-avoid"
              >
                <div className="border-b border-slate-200 p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      ورقة تشغيل وتجهيز
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                      <p>
                        <span className="text-slate-500">رقم الباتش:</span>{" "}
                        <span className="font-bold text-lg">
                          {batch.batchNumber}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">أمر الإنتاج:</span>{" "}
                        <span className="font-bold">{order.orderNumber}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">الموديل:</span>{" "}
                        <span className="font-bold">{order.styleName}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">العميل:</span>{" "}
                        <span className="font-bold">{order.customerName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrint(batch.id)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                      title="طباعة أمر التجهيز"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    {batch.prepStatus !== "مكتمل" ? (
                      <button
                        onClick={() => handleApproveBatch(batch.id)}
                        disabled={!allPrepared}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                          allPrepared
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
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

                <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">
                      تفاصيل المقاسات والألوان
                    </h4>
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
                                  <td
                                    className="py-2 font-bold text-slate-700"
                                    rowSpan={size.variants.length}
                                  >
                                    {size.size}
                                  </td>
                                )}
                                <td className="py-2 text-slate-600">
                                  {variant.color}
                                </td>
                                <td className="py-2 font-bold">
                                  {variant.quantity}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">
                      تجهيز الإكسسوارات والطباعة
                    </h4>
                    {!batch.accessoriesPrep ||
                    batch.accessoriesPrep.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        لا توجد إكسسوارات مطلوبة.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600">
                              <th className="border border-slate-200 p-2 font-medium">
                                الإكسسوار
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                الوحدة
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                المطلوب للقطعة
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                المطلوب للباتش
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                تم التجهيز
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {calculateBatchAccessories(order, batch).map(
                              (acc) => {
                                const roundedRequired =
                                  acc.requiredForBatch % 1 === 0
                                    ? acc.requiredForBatch
                                    : Number(acc.requiredForBatch.toFixed(3));

                                return (
                                  <tr
                                    key={acc.accessoryId || acc.accessoryName}
                                    className={
                                      acc.isPrepared ? "bg-emerald-50" : ""
                                    }
                                  >
                                    <td className="border border-slate-200 p-2 font-medium">
                                      {acc.accessoryName}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center text-slate-600">
                                      {acc.unit}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center text-slate-600">
                                      {acc.standardPerPiece}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center font-bold text-indigo-700">
                                      {roundedRequired}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center align-middle">
                                      <button
                                        onClick={() =>
                                          handleToggleAccessory(
                                            batch.id,
                                            acc.accessoryName,
                                          )
                                        }
                                        disabled={batch.prepStatus === "مكتمل"}
                                        className={`inline-flex items-center justify-center p-1 rounded transition-colors ${
                                          acc.isPrepared
                                            ? "text-emerald-600 hover:text-emerald-700"
                                            : "text-slate-400 hover:text-slate-600"
                                        } ${batch.prepStatus === "مكتمل" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                      >
                                        {acc.isPrepared ? (
                                          <CheckSquare className="w-6 h-6" />
                                        ) : (
                                          <Square className="w-6 h-6" />
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {batch.prepStatus === "مكتمل" && (
                  <div className="bg-emerald-50 p-4 border-t border-emerald-100 flex justify-between items-center text-sm text-emerald-700">
                    <span>
                      تم التجهيز بواسطة: <strong>{batch.prepApprovedBy}</strong>
                    </span>
                    <span>
                      تاريخ:{" "}
                      {new Date(batch.prepApprovedAt!).toLocaleDateString(
                        "ar-EG",
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {printingBatchId && (
        <BatchPreparationWorkOrder
          order={order}
          batch={order.batches.find((b) => b.id === printingBatchId)!}
        />
      )}
    </>
  );
}
