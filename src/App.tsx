import React, { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ProductionOrdersList } from "./components/ProductionOrdersList";
import { OrderManager } from "./components/OrderManager";
import { Settings } from "./components/Settings";

type ViewState = "dashboard" | "list" | "form" | "settings";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {}, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== "form") {
      setSelectedOrderId(null);
    }
  };

  const handleEditOrder = (id: string) => {
    setSelectedOrderId(id);
    setCurrentView("form");
  };

  const handleViewOrder = (id: string) => {
    setSelectedOrderId(id);
    setCurrentView("form");
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setCurrentView("list");
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
      {currentView === "list" && (
        <ProductionOrdersList
          onEdit={handleEditOrder}
          onView={handleViewOrder}
        />
      )}
      {currentView === "form" && (
        <OrderManager orderId={selectedOrderId} onBack={handleBackToList} />
      )}
      {currentView === "settings" && <Settings onBack={handleBackToList} />}
    </Layout>
  );
}
