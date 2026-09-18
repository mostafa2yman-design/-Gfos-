import React, { useState, useEffect } from "react";
import { ProductionOrderForm } from "./ProductionOrderForm";
import { CutOrderForm } from "./CutOrderForm";
import { BatchesForm } from "./BatchesForm";
import { PrintPrepSheet } from "./PrintPrepSheet";
import { PrintEmbroideryForm } from "./PrintEmbroideryForm";
import { SewingForm } from "./SewingForm";
import { FinishingForm } from "./FinishingForm";
import { IroningForm } from "./IroningForm";
import { PackingForm } from "./PackingForm";
import { CostAnalysisSummary } from "./CostAnalysisSummary";
import { Package } from "lucide-react";
import { ProductionOrder, OrderStatus } from "../types";
import { getOrderById } from "../lib/storage";
import { eventBus } from "../lib/events";
import { createOrderWorkflowHandlers } from "../lib/events/eventHandlers";
import { BusinessEvent } from "../lib/events/eventTypes";
import {
  ArrowRight,
  Scissors,
  FileText,
  Layers,
  CheckSquare,
  Printer,
  Shirt,
  Sparkles,
} from "lucide-react";
import {
  isCutEnabled,
  isBatchesEnabled,
  isPrepEnabled,
  isPrintEnabled,
  isSewEnabled,
  isFinishEnabled,
  getDefaultTabForStatus,
  TabType,
} from "../lib/orderWorkflow";

interface OrderManagerProps {
  orderId: string | null;
  onBack: () => void;
  initialTab?: string;
  onNavigateToAccounting?: (
    tab?: any,
    returnInfo?: { orderId: string; tab: string; orderNumber?: string },
    autoOpenAdd?: boolean
  ) => void;
}


const getTabStatus = (tab: TabType, order: ProductionOrder): 'approved' | 'saved' | 'pending' => {
  if (!order) return 'pending';
  switch (tab) {
    case 'production':
      return order.productionApprovedAt ? 'approved' : 'saved';
    case 'cut':
      if (order.cutData?.approvedAt) return 'approved';
      if (order.cutData) return 'saved';
      return 'pending';
    case 'batches':
      if (order.batchesLockedAt) return 'approved';
      if (order.batches && order.batches.length > 0) return 'saved';
      return 'pending';
    case 'prep':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.prepStatus === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.prepStatus === 'جاري' || b.prepStatus === 'مكتمل' || (b.accessoriesPrep && b.accessoriesPrep.some(a => a.isPrepared)))) return 'saved';
      }
      return 'pending';
    case 'print':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.printEmbroideryStatus === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.printEmbroideryStatus === 'جاري' || b.printEmbroideryStatus === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'sew':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.sewingData?.status === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.sewingData?.status === 'جاري' || b.sewingData?.status === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'finish':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.finishingData?.status === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.finishingData?.status === 'جاري' || b.finishingData?.status === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'ironing':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.ironingData?.status === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.ironingData?.status === 'جاري' || b.ironingData?.status === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'packing':
      if (order.packingApprovedAt || order.status === 'التغليف معتمد' || order.packingStatus === 'مكتمل') return 'approved';
      if (order.packingInvoices && order.packingInvoices.length > 0) return 'saved';
      return 'pending';
    default:
      return 'pending';
  }
};

const getTabColorClasses = (isActive: boolean, status: 'approved' | 'saved' | 'pending') => {
  if (isActive) {
    if (status === 'approved') return "bg-emerald-100 text-emerald-800 border-emerald-200 ring-2 ring-emerald-500 shadow-sm";
    if (status === 'saved') return "bg-blue-100 text-blue-800 border-blue-200 ring-2 ring-blue-500 shadow-sm";
    return "bg-red-100 text-red-800 border-red-200 ring-2 ring-red-500 shadow-sm";
  } else {
    if (status === 'approved') return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100";
    if (status === 'saved') return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100";
    return "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100 opacity-75 hover:opacity-100";
  }
};

export function OrderManager({
  orderId: initialOrderId,
  onBack,
  initialTab = "production",
  onNavigateToAccounting,
}: OrderManagerProps) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(
    initialOrderId,
  );
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as TabType);
    }
  }, [initialTab, initialOrderId]);
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  const loadOrder = async (id: string | null, forceTabChange = true) => {
    if (id) {
      const found = await getOrderById(id);
      if (found) {
        setOrder(found);

        if (forceTabChange) {
          // Auto-select tab based on status if opening
          setActiveTab(getDefaultTabForStatus(found.status));
        }
      } else {
        // If order not found (e.g., just deleted), go back
        onBack();
      }
    }
  };

  useEffect(() => {
    setCurrentOrderId(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    if (currentOrderId) {
      loadOrder(currentOrderId, true);
    }
  }, [currentOrderId]);

  // Subscribe to Event Bus for reactive UI updates
  useEffect(() => {
    if (!currentOrderId) return;

    const handlers = createOrderWorkflowHandlers({
      onOrderUpdated: (updatedOrder) => {
        setOrder(updatedOrder);
      },
      onOrderDeleted: onBack,
      onNavigate: setActiveTab,
    });


    const handlerAdapter = (event: BusinessEvent<any>) => {
      // Only react to events for the currently managed order
      if (
        event.aggregateType === "ProductionOrder" &&
        event.aggregateId === currentOrderId
      ) {
        if (event.type === "ProductionOrderSaved")
          handlers.handleProductionOrderSaved(event);
        else if (event.type === "ProductionOrderApproved")
          handlers.handleProductionOrderApproved(event);
        else if (event.type === "ProductionOrderDeleted")
          handlers.handleProductionOrderDeleted(event);
        else if (event.type === "CutActualEntered")
          handlers.handleCutActualEntered(event);
        else if (event.type === "CutOrderApproved")
          handlers.handleCutOrderApproved(event);
        else if (event.type === "BatchSplitCompleted")
          handlers.handleBatchSplitCompleted(event);
        else if (event.type === "BatchesLocked")
          handlers.handleBatchesLocked(event);
        else if (event.type === "PreparationStarted")
          handlers.handlePreparationStarted(event);
        else if (event.type === "BatchPreparationCompleted")
          handlers.handleBatchPreparationCompleted(event);
        else if (event.type === "PreparationCompleted")
          handlers.handlePreparationCompleted(event);
        else if (event.type === "PrintEmbroiderySaved")
          handlers.handlePrintEmbroiderySaved(event);
        else if (event.type === "PrintEmbroideryCompleted")
          handlers.handlePrintEmbroideryCompleted(event);
      }
    };

    const typesToWatch: import("../lib/events/eventTypes").EventType[] = [
      "ProductionOrderSaved",
      "ProductionOrderApproved",
      "ProductionOrderDeleted",
      "CutActualEntered",
      "CutOrderApproved",
      "BatchSplitCompleted",
      "BatchesLocked",
      "PreparationStarted",
      "BatchPreparationCompleted",
      "PreparationCompleted",
      "PrintEmbroiderySaved",
      "PrintEmbroideryCompleted",
    ];

    const unsubscribers = typesToWatch.map((type) =>
      eventBus.subscribe(type, handlerAdapter),
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [currentOrderId]);

  if (!currentOrderId) {
    // New order
    return (
      <ProductionOrderForm
        orderId={null}
        isViewOnly={false}
        onOrderSaved={(id) => setCurrentOrderId(id)}
        onOrderApproved={(id) => {
          setCurrentOrderId(id);
          setActiveTab("cut");
        }}
        onDeleted={onBack}
        onBack={onBack}
      />
    );
  }

  if (!order) return <div className="p-8 text-center">جاري التحميل...</div>;

  const isCutEnabledStatus = isCutEnabled(order.status);
  const isBatchesEnabledStatus = isBatchesEnabled(order.status);
  const isPrepEnabledStatus = isPrepEnabled(order.status);
  const isPrintEnabledStatus = isPrintEnabled(order.status);
  const isSewEnabledStatus = isSewEnabled(order.status);
  const isFinishEnabledStatus = isFinishEnabled(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">
          إدارة أمر الإنتاج: {order.orderNumber}
        </h2>
        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold mr-auto">
          {order.status}
        </span>
      </div>

      {/* تحليل تكلفة أمر الإنتاج في أول الصفحة بشكل كامل */}
      <CostAnalysisSummary order={order} defaultExpanded={true} />

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("production")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "production", getTabStatus("production", order))}`}
        >
          <FileText className="w-5 h-5" />
          أمر الإنتاج والخامات
        </button>
        <button
          onClick={() => setActiveTab("cut")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "cut", getTabStatus("cut", order))}`}
        >
          <Scissors className="w-5 h-5" />
          أمر القص الفعلي
        </button>
        <button
          onClick={() => setActiveTab("batches")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "batches", getTabStatus("batches", order))}`}
        >
          <Layers className="w-5 h-5" />
          تقسيم الباتشات
        </button>

        <button
          onClick={() => setActiveTab("prep")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "prep", getTabStatus("prep", order))}`}
        >
          <CheckSquare className="w-5 h-5" />
          التجهيز
        </button>
        <button
          
          onClick={() => setActiveTab("print")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === "print"
              ? "bg-indigo-50 text-indigo-700"
              
                : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Printer className="w-5 h-5" />
          الطباعة / التطريز
        </button>
        <button
          onClick={() => setActiveTab("sew")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "sew", getTabStatus("sew", order))}`}
        >
          <Shirt className="w-5 h-5" />
          الخياطة
        </button>
<button
          onClick={() => setActiveTab("finish")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "finish", getTabStatus("finish", order))}`}
        >
          <Sparkles className="w-5 h-5" />
          التشطيب
        </button>
<button
          onClick={() => setActiveTab("ironing")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "ironing", getTabStatus("ironing", order))}`}
        >
          <Sparkles className="w-5 h-5" />
          المكواة
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "packing", getTabStatus("packing", order))}`}
        >
          <Package className="w-5 h-5" />
          التغليف
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {activeTab === "production" && (
          <ProductionOrderForm
            key={order.updatedAt}
            orderId={currentOrderId}
            isViewOnly={isCutEnabledStatus}
            onOrderSaved={(id) => {}}
            onOrderApproved={(id) => setActiveTab("cut")}
            onDeleted={() => {}}
            onBack={onBack}
          />
        )}
        {activeTab === "cut" && (
          <CutOrderForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}
        {activeTab === "batches" && (
          <BatchesForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}

        {activeTab === "prep" && (
          <PrintPrepSheet
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}
        {activeTab === "print" && (
          <PrintEmbroideryForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}
        {activeTab === "sew" && (
          <SewingForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}
        {activeTab === "finish" && (
          <FinishingForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}
        {activeTab === "ironing" && (
          <IroningForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
          />
        )}

        {activeTab === "packing" && (
          <PackingForm
            key={order.updatedAt}
            orderId={currentOrderId}
            onSaved={() => {}}
            onNavigateToAccounting={onNavigateToAccounting}
          />
        )}
      </div>
    </div>
  );
}
