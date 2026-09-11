import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ProductionOrdersList } from "./components/ProductionOrdersList";
import { OrderManager } from "./components/OrderManager";
import { Settings } from "./components/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";

type ViewState = "dashboard" | "list" | "form" | "settings";

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("production");

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== "form") {
      setSelectedOrderId(null);
    }
  };

  const handleNavigateToOrder = (id: string, tab: string = "production") => {
    setSelectedOrderId(id);
    setSelectedTab(tab);
    setCurrentView("form");
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
      {currentView === "dashboard" && <Dashboard onNavigate={handleNavigate} onNavigateToOrder={handleNavigateToOrder} />}
      {currentView === "list" && (
        <ProductionOrdersList
          onEdit={handleEditOrder}
          onView={handleViewOrder}
        />
      )}
      {currentView === "form" && (
        <OrderManager orderId={selectedOrderId} onBack={handleBackToList} initialTab={selectedTab} />
      )}
      {currentView === "settings" && <Settings onBack={handleBackToList} />}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
