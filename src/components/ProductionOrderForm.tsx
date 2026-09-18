import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, Variant, MaterialInstance, AccessoryInstance } from "../types";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { OrderBasicInfo } from "./form/OrderBasicInfo";
import { SizeCard } from "./form/SizeCard";
import { OrderSummary } from "./form/OrderSummary";
import { BomSection } from "./form/BomSection";
import { calculateFabricAnalysis } from "../lib/fabricUtils";
import { FabricSummary } from "./FabricSummary";
import { CostAnalysisSummary } from "./CostAnalysisSummary";
import { generateOrderNumber, getOrderById, getOrders } from "../lib/storage";
import { getBomTemplateForStyle } from "../lib/bom";
import { getAvailableSizes, addCustomSize } from "../lib/sizes";
import { CopyBomModal } from "./CopyBomModal";
import {
  Save,
  Copy,
  X,
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
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [tempSize, setTempSize] = useState('');
  const [isCopyBomOpen, setIsCopyBomOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'new'|'copy'>('new');
  const [sourceOrderId, setSourceOrderId] = useState('');
  const [previousOrders, setPreviousOrders] = useState<ProductionOrder[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        const orders = await getOrders();
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setPreviousOrders(orders);
      }
    };
    load();
  }, [orderId]);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const addSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (orderId) {
        const existing = await getOrderById(orderId);
        if (existing) {
          setOrder(existing);
        }
      } else {
        const newOrderNum = await generateOrderNumber();
        setOrder((prev) => ({ ...prev, orderNumber: newOrderNum }));
      }
    };
    load();
  }, [orderId]);

  // Click outside listener for Add Size dropdown
  useEffect(() => {
    if (!isAddSizeOpen) return;
    const handleClickOutside = async (event: MouseEvent | TouchEvent) => {
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
      if (field === 'printEmbroideryStandardCost' || field === 'standardSewingCostPerPiece' || field === 'standardFinishingCostPerPiece' || field === 'standardCutCostPerPiece' || field === 'standardIroningCostPerPiece' || field === 'sellingPrice') {
        const parsed = parseFloat(value); finalValue = isNaN(parsed) ? undefined : parsed;
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

  const executeCommand = async <Args extends unknown[]>(
    commandFn: (o: ProductionOrder, ...args: Args) => ProductionOrder,
    ...args: Args
  ) => {
    if (isReadOnly) return;
    const newOrder = commandFn(order, ...args);

    // Autosave immediately if it's already an existing persisted order
    if (orderId && ["مسودة"].includes(order.status)) {
      const result = await Cmd.saveDraft(newOrder);
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

  const handleAddSize = async (sizeName: string) => {
    executeCommand(Cmd.addSize, sizeName);
    setIsAddSizeOpen(false);
  };

  const handleRemoveSize = async (sizeName: string) => {
    if (isReadOnly) return;
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من حذف هذا المقاس بجميع ألوانه وكمياته؟",
      onConfirm: async () => {
        executeCommand(Cmd.removeSize, sizeName);
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleCopySize = async (sourceSizeName: string, targetSizeName: string) => {
    executeCommand(Cmd.copySize, sourceSizeName, targetSizeName);
  };

  const handleAddVariant = async (sizeName: string) => {
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

  const handleRemoveVariant = async (sizeName: string, variantIndex: number) => {
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

  const handleDeleteOrder = async () => {
    if (!orderId) return;
    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من حذف أمر الإنتاج؟\n\nسيتم حذف أمر الإنتاج وجميع بياناته التابعة التي لم تدخل في التنفيذ الفعلي. لا يمكن التراجع عن هذه العملية.",
      onConfirm: async () => {
        const result = await Cmd.deleteProductionOrder(order);
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

  const handleSaveDraft = async () => {
    if (isReadOnly && order.status !== "مسودة") return;
    if (validate()) {
      const result = await Cmd.saveDraft(order);
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

  const handleApproveOrder = async () => {
    if (isReadOnly && order.status !== "مسودة") return;
    if (validate()) {
      setConfirmConfig({
        isOpen: true,
        message:
          "هل أنت متأكد من اعتماد أمر الإنتاج وقائمة الخامات (BOM)؟ لن تتمكن من تعديل البيانات الأساسية أو الكميات أو تفاصيل الخامات بعد الاعتماد.",
        onConfirm: async () => {
          const result = await Cmd.approveProductionOrder(order);
          if (result.success) {
            setConfirmConfig(null);
            setSuccess("تم اعتماد أمر الإنتاج والخامات بنجاح.");
            setError(null);
            if (result.data) setOrder(result.data);
            onOrderApproved(order.id);
          } else {
            setConfirmConfig(null);
            setError(result.error || "حدث خطأ أثناء الاعتماد");
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

  const handleCopyBom = async (materials: MaterialInstance[], accessories: AccessoryInstance[]) => {
    setOrder(prev => {
      // Create new UUIDs for the copied items to avoid key collisions
      const newMaterials = materials.map(m => ({ ...m, id: crypto.randomUUID() }));
      const newAccessories = accessories.map(a => ({ ...a, id: crypto.randomUUID() }));
      
      // we can merge or replace. the prompt asks to copy BOM. replacing is safer.
      return {
        ...prev,
        materials: newMaterials,
        accessories: newAccessories
      };
    });
    setIsCopyBomOpen(false);
  };

  const usedSizes = order.sizes.map((s) => s.size);
  const allSizes = getAvailableSizes();
  const availableSizes = allSizes.filter((s) => !usedSizes.includes(s));

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
                className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium"
              >
                <Save className="w-4 h-4" />
                حفظ كمسودة
              </button>
              {order.status === "مسودة" && (
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-bold text-sm"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  اعتماد أمر الإنتاج والخامات
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {order.status !== "مسودة" && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  تم اعتماد أمر الإنتاج وقائمة المواد والخامات (BOM) بنجاح
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  معتمد
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {order.productionApprovedBy ? `بواسطة: ${order.productionApprovedBy}` : ''}
                {order.productionApprovedAt ? ` • بتاريخ: ${new Date(order.productionApprovedAt).toLocaleString('ar-EG')}` : ''}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg">
            البيانات الأساسية وتكاليف الخامات مثبتة ومحمية من التعديل
          </span>
        </div>
      )}

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
            standardCutCostPerPiece={order.standardCutCostPerPiece}
            printEmbroideryStandardCost={order.printEmbroideryStandardCost}
            standardSewingCostPerPiece={order.standardSewingCostPerPiece}
            standardFinishingCostPerPiece={order.standardFinishingCostPerPiece}
            standardIroningCostPerPiece={order.standardIroningCostPerPiece}
            sellingPrice={order.sellingPrice}
            finishingInstructions={order.finishingInstructions}
            ironingInstructions={order.ironingInstructions}
            packingInstructions={order.packingInstructions}
            onChange={handleBasicInfoChange}
            readOnly={isReadOnly}
          />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                جدول المقاسات والألوان
              </h3>
              {!isReadOnly && (
                <div className="relative" ref={addSizeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddSizeOpen((prev) => !prev);
                      setIsCustomSize(false);
                      setTempSize('');
                    }}
                    className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مقاس
                  </button>
                  {isAddSizeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden flex flex-col max-h-[500px]">
                      {!isCustomSize ? (
                        <div className="overflow-y-auto flex-1">
                          <button
                            type="button"
                            onClick={() => setIsCustomSize(true)}
                            className="w-full text-right px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            -- إدخال مقاس يدوياً --
                          </button>
                          <div className="border-b border-slate-100 my-1"></div>
                          {availableSizes.map((sz) => (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => {
                                handleAddSize(sz);
                                setIsAddSizeOpen(false);
                              }}
                              className="w-full text-right px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                            >
                              المقاس {sz}
                            </button>
                          ))}
                          {availableSizes.length === 0 && (
                            <div className="px-4 py-2 text-sm text-slate-400">لا توجد مقاسات متاحة</div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-50">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المقاس الجديد</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={tempSize}
                              onChange={(e) => setTempSize(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = tempSize.trim();
                                  if (trimmed) {
                                    addCustomSize(trimmed);
                                    handleAddSize(trimmed);
                                    setIsAddSizeOpen(false);
                                    setIsCustomSize(false);
                                  }
                                } else if (e.key === 'Escape') {
                                  setIsCustomSize(false);
                                }
                              }}
                              placeholder="اكتب المقاس..."
                              autoFocus
                              className="w-full pr-2 pl-16 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const trimmed = tempSize.trim();
                                  if (trimmed) {
                                    addCustomSize(trimmed);
                                    handleAddSize(trimmed);
                                    setIsAddSizeOpen(false);
                                    setIsCustomSize(false);
                                  }
                                }}
                                disabled={!tempSize.trim()}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md disabled:opacity-50 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsCustomSize(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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


          <div className="flex justify-between items-center mt-8 mb-4">
            <h2 className="text-xl font-bold text-slate-800">قائمة الخامات والإكسسوارات (BOM)</h2>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsCopyBomOpen(true)}
                className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Copy className="w-4 h-4" />
                نسخ من أمر سابق
              </button>
            )}
          </div>
          
          <BomSection
            order={order}
            onChange={handleBomChange}
            readOnly={isReadOnly}
          />
          
          <CopyBomModal 
            isOpen={isCopyBomOpen}
            onClose={() => setIsCopyBomOpen(false)}
            onSelect={handleCopyBom}
            currentOrderId={order.id}
          />

          {fabricSummary && (
            <div className="mt-8">
              <FabricSummary summary={fabricSummary} />
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <OrderSummary sizes={order.sizes} actualSizes={(['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'مغلق'].includes(order.status) && order.cutData?.sizes) ? order.cutData.sizes : undefined} />
            <CostAnalysisSummary order={order} />

            
            {!isReadOnly && order.status === "مسودة" && (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg font-bold text-base cursor-pointer"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  اعتماد أمر الإنتاج والخامات
                </button>
                <p className="text-xs text-center text-slate-500">
                  الاعتماد يقوم بتثبيت الكميات والمواصفات وبدء مرحلة القص
                </p>
              </div>
            )}
            {(isReadOnly || order.status !== "مسودة") && order.id && (
              <div className="mt-6 p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                    <span>تم الاعتماد بنجاح</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    معتمد
                  </span>
                </div>
                <div className="text-xs text-emerald-700 pt-1 border-t border-emerald-100 space-y-0.5">
                  <p>أمر الإنتاج وقائمة الخامات (BOM) معتمدة</p>
                  {order.productionApprovedBy && (
                    <p className="font-medium text-emerald-800">بواسطة: {order.productionApprovedBy}</p>
                  )}
                  {order.productionApprovedAt && (
                    <p className="text-slate-500 text-[11px]">{new Date(order.productionApprovedAt).toLocaleString('ar-EG')}</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
