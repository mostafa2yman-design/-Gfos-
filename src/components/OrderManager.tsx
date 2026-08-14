import React, { useState, useEffect } from "react";
import { ProductionOrderForm } from "./ProductionOrderForm";
import { CutOrderForm } from "./CutOrderForm";
import { BatchesForm } from "./BatchesForm";
import { PrintPrepSheet } from "./PrintPrepSheet";
import { PrintEmbroideryForm } from "./PrintEmbroideryForm";
import { SewingForm } from "./SewingForm";
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
} from "lucide-react";
import {
  isCutEnabled,
  isBatchesEnabled,
  isPrepEnabled,
  isPrintEnabled,
  isSewEnabled,
  getDefaultTabForStatus,
  TabType,
} from "../lib/orderWorkflow";

interface OrderManagerProps {
  orderId: string | null;
  onBack: () => void;
}

export function OrderManager({
  orderId: initialOrderId,
  onBack,
}: OrderManagerProps) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(
    initialOrderId,
  );
  const [activeTab, setActiveTab] = useState<TabType>("production");
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  const loadOrder = (id: string | null, forceTabChange = true) => {
    if (id) {
      const found = getOrderById(id);
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

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("production")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === "production"
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-5 h-5" />
          أمر الإنتاج والخامات
        </button>
        <button
          
          onClick={() => setActiveTab("cut")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === "cut"
              ? "bg-indigo-50 text-indigo-700"
              
                : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Scissors className="w-5 h-5" />
          أمر القص الفعلي
        </button>
        <button
          
          onClick={() => setActiveTab("batches")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === "batches"
              ? "bg-indigo-50 text-indigo-700"
              
                : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-5 h-5" />
          تقسيم الباتشات
        </button>

        <button
          
          onClick={() => setActiveTab("prep")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === "prep"
              ? "bg-indigo-50 text-indigo-700"
              
                : "text-slate-600 hover:bg-slate-50"
          }`}
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
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === "sew"
              ? "bg-indigo-50 text-indigo-700"
              
                : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Shirt className="w-5 h-5" />
          الخياطة
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
      </div>
    </div>
  );
}
