import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, PREDEFINED_SIZES, Variant, MaterialInstance, AccessoryInstance } from "../types";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { OrderBasicInfo } from "./form/OrderBasicInfo";
import { SizeCard } from "./form/SizeCard";
import { OrderSummary } from "./form/OrderSummary";
import { BomSection } from "./form/BomSection";
import { calculateFabricAnalysis } from "../lib/fabricUtils";
import { FabricSummary } from "./FabricSummary";
import { CostAnalysisSummary } from "./CostAnalysisSummary";
import { generateOrderNumber, getOrderById } from "../lib/storage";
import { getBomTemplateForStyle } from "../lib/bom";
import {
  Save,
  AlertCircle,
  Plus,
  CheckCircle2,
  ArrowRight,
  Check,
  Trash2,
} from "lucide-react";

import * as Cmd from "../lib/productionOrderCommands";
interface ProductionOrderFormProps {
  key?: React.Key;
  onOrderSaved: (orderId: string) => void;
  onOrderApproved: (orderId: string) => void;
  onBack: () => void;
  orderId?: string | null;

  onDeleted?: () => void;
  isViewOnly?: boolean;
}

export function ProductionOrderForm({
  orderId,
  onOrderSaved,
  onOrderApproved,
  onDeleted,
  onBack,
  isViewOnly = false,
}: ProductionOrderFormProps) {
  const [order, setOrder] = useState<ProductionOrder>({
    id: crypto.randomUUID(),
    orderNumber: "",
    orderDate: new Date().toISOString().split("T")[0],
    styleName: "",
    category: "",
    customerName: "",
    status: "مسودة",
    sizes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const addSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderId) {
      const existing = getOrderById(orderId);
      if (existing) {
        setOrder(existing);
      }
    } else {
      setOrder((prev) => ({ ...prev, orderNumber: generateOrderNumber() }));
    }
  }, [orderId]);

  // Click outside listener for Add Size dropdown
  useEffect(() => {
    if (!isAddSizeOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        addSizeRef.current &&
        !addSizeRef.current.contains(event.target as Node)
      ) {
        setIsAddSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isAddSizeOpen]);

  const isReadOnly = isViewOnly || order.status !== "مسودة";

  const handleBasicInfoChange = (
    field: keyof ProductionOrder,
    value: string,
  ) => {
    if (isReadOnly) return;
    setOrder((prev) => {
      let finalValue: any = value;
      if (field === 'printEmbroideryStandardCost' || field === 'standardSewingCostPerPiece') {
        finalValue = value === '' ? undefined : parseFloat(value);
      }
      const next = { ...prev, [field]: finalValue };

      // Auto-load BOM if styleName changes and matches a template
      if (field === "styleName") {
        const bom = getBomTemplateForStyle(value);
        if (bom) {
          next.materials = bom.materials;
          next.accessories = bom.accessories;
        }
      }
      return next;
    });
    setError(null);
  };

  const executeCommand = <Args extends unknown[]>(
    commandFn: (o: ProductionOrder, ...args: Args) => ProductionOrder,
    ...args: Args
  ) => {
    if (isReadOnly) return;
    const newOrder = commandFn(order, ...args);

    // Autosave immediately if it's already an existing persisted order
    if (orderId && ["مسودة"].includes(order.status)) {
      const result = Cmd.saveDraft(newOrder);
      if (result.success) {
        if (result.data) setOrder(result.data);
      } else {
        setError(result.error || "حدث خطأ");
        return;
      }
    } else {
      setOrder(newOrder);
    }
    setError(null);
  };

  const handleAddSize = (sizeName: string) => {
    executeCommand(Cmd.addSize, sizeName);
    setIsAddSizeOpen(false);
  };

  const handleRemoveSize = (sizeName: string) => {
    if (isReadOnly) return;
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من حذف هذا المقاس بجميع ألوانه وكمياته؟",
      onConfirm: () => {
        executeCommand(Cmd.removeSize, sizeName);
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleCopySize = (sourceSizeName: string, targetSizeName: string) => {
    executeCommand(Cmd.copySize, sourceSizeName, targetSizeName);
  };

  const handleAddVariant = (sizeName: string) => {
    executeCommand(Cmd.addVariant, sizeName, "", 0);
  };

  const handleUpdateVariant = (
    sizeName: string,
    variantIndex: number,
    field: keyof Variant,
    value: string | number,
  ) => {
    if (field === "color") {
      executeCommand(
        Cmd.updateVariantColor,
        sizeName,
        variantIndex,
        value as string,
      );
    } else if (field === "quantity") {
      executeCommand(
        Cmd.updateVariantQuantity,
        sizeName,
        variantIndex,
        value as number,
      );
    }
  };

  const handleRemoveVariant = (sizeName: string, variantIndex: number) => {
    executeCommand(Cmd.removeVariant, sizeName, variantIndex);
  };

  const validate = (): boolean => {
    if (!order.styleName.trim()) {
      setError("يجب إدخال اسم القصة.");
      return false;
    }
    if (!order.category) {
      setError("يجب اختيار نوع القصة.");
      return false;
    }
    if (!order.customerName.trim()) {
      setError("يجب إدخال اسم العميل.");
      return false;
    }
    if (order.sizes.length === 0) {
      setError("يجب إضافة مقاس واحد على الأقل.");
      return false;
    }

    const sizeNames = order.sizes.map((s) => s.size);
    if (new Set(sizeNames).size !== sizeNames.length) {
      setError("يوجد مقاس مكرر داخل هذا الأمر.");
      return false;
    }

    for (const size of order.sizes) {
      if (size.variants.length === 0) {
        setError(`المقاس ${size.size} لا يحتوي على أي ألوان.`);
        return false;
      }

      const colorsInSize = new Set<string>();
      for (const variant of size.variants) {
        if (!variant.color) {
          setError(`يوجد لون غير محدد في المقاس ${size.size}.`);
          return false;
        }

        if (colorsInSize.has(variant.color)) {
          setError(`اللون "${variant.color}" مكرر داخل المقاس ${size.size}.`);
          return false;
        }
        colorsInSize.add(variant.color);

        const qty = Number(variant.quantity);
        if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
          setError(
            `يجب إدخال كمية صحيحة أكبر من صفر للون ${variant.color} في المقاس ${size.size}.`,
          );
          return false;
        }
      }
    }

    setError(null);
    return true;
  };

  const handleDeleteOrder = () => {
    if (!orderId) return;
    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من حذف أمر الإنتاج؟\n\nسيتم حذف أمر الإنتاج وجميع بياناته التابعة التي لم تدخل في التنفيذ الفعلي. لا يمكن التراجع عن هذه العملية.",
      onConfirm: () => {
        const result = Cmd.deleteProductionOrder(order);
        if (result.success) {
          setConfirmConfig(null);
          if (onDeleted) {
            onDeleted();
          } else {
            onBack();
          }
        } else {
          setConfirmConfig(null);
          setError(result.error || "حدث خطأ");
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleSaveDraft = () => {
    if (isReadOnly && order.status !== "مسودة") return;
    if (validate()) {
      const result = Cmd.saveDraft(order);
      if (result.success) {
        setSuccess("تم حفظ الأمر كمسودة بنجاح.");
        setError(null);
        if (result.data) setOrder(result.data);
        if (onOrderSaved) onOrderSaved(order.id);
      } else {
        setError(result.error || "حدث خطأ");
      }
    }
  };

  const handleApproveOrder = () => {
    if (isReadOnly && order.status !== "مسودة") return;
    if (validate()) {
      setConfirmConfig({
        isOpen: true,
        message:
          "هل أنت متأكد من الاعتماد؟ لن تتمكن من تعديل البيانات الأساسية بعد الاعتماد.",
        onConfirm: () => {
          const result = Cmd.approveProductionOrder(order);
          if (result.success) {
            setConfirmConfig(null);
            setSuccess("تم الاعتماد بنجاح.");
            setError(null);
            if (result.data) setOrder(result.data);
            onOrderApproved(order.id);
          } else {
            setConfirmConfig(null);
            setError(result.error || "حدث خطأ");
          }
        },
        onCancel: () => setConfirmConfig(null),
      });
    }
  };

  const handleBomChange = (
    field: "materials" | "accessories",
    value: MaterialInstance[] | AccessoryInstance[],
  ) => {
    if (isReadOnly) return;
    setOrder((prev) => ({ ...prev, [field]: value }));
  };

  const usedSizes = order.sizes.map((s) => s.size);
  const availableSizes = PREDEFINED_SIZES.filter((s) => !usedSizes.includes(s));

  const fabricSummary = calculateFabricAnalysis(order, order.cutData);
  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isReadOnly
                ? `عرض أمر الإنتاج (${order.orderNumber})`
                : orderId
                  ? "تعديل أمر الإنتاج"
                  : "إنشاء أمر إنتاج أولي"}
            </h2>
            {isReadOnly && (
              <span className="inline-block mt-0.5 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                وضع العرض فقط (غير قابل للتعديل)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {orderId && Cmd.canDeleteProductionOrder(order) && (
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              حذف أمر الإنتاج
            </button>
          )}
          {isReadOnly ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 bg-slate-600 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-medium"
            >
              إغلاق
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium"
              >
                <Save className="w-4 h-4" />
                حفظ كمسودة
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-r-4 border-emerald-500 p-4 rounded-lg flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <OrderBasicInfo
            orderNumber={order.orderNumber}
            orderDate={order.orderDate}
            styleName={order.styleName}
            category={order.category}
            customerName={order.customerName}
            onChange={handleBasicInfoChange}
            readOnly={isReadOnly}
          />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                جدول المقاسات والألوان
              </h3>
              {!isReadOnly && availableSizes.length > 0 && (
                <div className="relative" ref={addSizeRef}>
                  <button
                    type="button"

                    onClick={() => setIsAddSizeOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مقاس
                  </button>
                  {isAddSizeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                      {availableSizes.map((sz) => (
                        <button
                          type="button"
                          key={sz}

                          onClick={() => handleAddSize(sz)}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          المقاس {sz}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {order.sizes.length > 0 ? (
                order.sizes.map((sizeData, index) => (
                  <SizeCard
                    key={sizeData.size}
                    sizeData={sizeData}
                    availableSizesToCopy={availableSizes}
                    onUpdateVariant={(variantIndex, field, value) =>
                      handleUpdateVariant(
                        sizeData.size,
                        variantIndex,
                        field,
                        value,
                      )
                    }
                    onAddVariant={() => handleAddVariant(sizeData.size)}
                    onRemoveVariant={(variantIndex) =>
                      handleRemoveVariant(sizeData.size, variantIndex)
                    }
                    onRemoveSize={() => handleRemoveSize(sizeData.size)}
                    onCopySize={(targetSize) =>
                      handleCopySize(sizeData.size, targetSize)
                    }
                    readOnly={isReadOnly}
                  />
                ))
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium mb-2">
                    لم يتم إضافة أي مقاسات بعد
                  </p>
                  <p className="text-slate-400 text-sm">
                    قم بإضافة مقاس للبدء في تحديد الألوان والكميات
                  </p>
                </div>
              )}
            </div>
          </div>

          <BomSection
            order={order}
            onChange={handleBomChange}
            readOnly={isReadOnly}
          />
          {fabricSummary && (
            <div className="mt-8">
              <FabricSummary summary={fabricSummary} />
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <OrderSummary sizes={order.sizes} actualSizes={(order.status !== "جديد" && order.status !== "باتشات مسجلة" && order.cutData?.sizes) ? order.cutData.sizes : undefined} />
            <CostAnalysisSummary order={order} />

            {!isReadOnly && order.status === "مسودة" && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg font-bold text-lg"
                >
                  <Check className="w-5 h-5" />
                  اعتماد
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
