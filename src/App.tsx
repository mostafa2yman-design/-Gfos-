import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ProductionOrdersList } from "./components/ProductionOrdersList";
import { OrderManager } from "./components/OrderManager";
import { Settings } from "./components/Settings";
import { ConfigurationDashboard, AccountingTab } from "./components/accounting/ConfigurationDashboard";
import { FinishedGoodsWarehouse } from "./components/FinishedGoodsWarehouse";
import { ThemeProvider } from "./contexts/ThemeContext";

type ViewState = "dashboard" | "list" | "form" | "settings" | "accounting_config" | "finished_goods_warehouse";

interface ReturnDestination {
  orderId: string;
  tab: string;
  orderNumber?: string;
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("production");
  const [accountingTab, setAccountingTab] = useState<AccountingTab>("accounts");
  const [accountingAutoOpenAdd, setAccountingAutoOpenAdd] = useState<boolean>(false);
  const [returnDestination, setReturnDestination] = useState<ReturnDestination | null>(null);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== "form") {
      setSelectedOrderId(null);
    }
    if (view !== "accounting_config") {
      setAccountingAutoOpenAdd(false);
    }
  };

  const handleNavigateToOrder = (id: string, tab: string = "production") => {
    setSelectedOrderId(id);
    setSelectedTab(tab);
    setCurrentView("form");
  };

  const handleNavigateToAccounting = (
    tab: AccountingTab = "customers",
    returnInfo?: ReturnDestination,
    autoOpenAdd: boolean = false
  ) => {
    setAccountingTab(tab);
    setAccountingAutoOpenAdd(autoOpenAdd);
    if (returnInfo) {
      setReturnDestination(returnInfo);
    }
    setCurrentView("accounting_config");
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
        <OrderManager
          orderId={selectedOrderId}
          onBack={handleBackToList}
          initialTab={selectedTab}
          onNavigateToAccounting={handleNavigateToAccounting}
        />
      )}
      {currentView === "settings" && <Settings onBack={handleBackToList} />}
      {currentView === "finished_goods_warehouse" && (
        <FinishedGoodsWarehouse
          onNavigateToOrder={(orderId, tab) => handleNavigateToOrder(orderId, tab || "packing")}
        />
      )}
      {currentView === "accounting_config" && (
        <ConfigurationDashboard
          initialTab={accountingTab}
          autoOpenAddCustomer={accountingAutoOpenAdd}
          returnDestination={returnDestination}
          onReturn={() => {
            if (returnDestination) {
              handleNavigateToOrder(returnDestination.orderId, returnDestination.tab);
              setReturnDestination(null);
            } else {
              handleNavigate("list");
            }
          }}
        />
      )}
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
