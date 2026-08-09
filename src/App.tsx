import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductionOrdersList } from './components/ProductionOrdersList';
import { ProductionOrderForm } from './components/ProductionOrderForm';
import { initializeDummyData } from './lib/storage';

type ViewState = 'dashboard' | 'list' | 'form';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState<boolean>(false);

  useEffect(() => {
    initializeDummyData();
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== 'form') {
      setSelectedOrderId(null);
      setIsViewOnlyMode(false);
    } else {
      // Navigating to new form
      setSelectedOrderId(null);
      setIsViewOnlyMode(false);
    }
  };

  const handleEditOrder = (id: string) => {
    setSelectedOrderId(id);
    setIsViewOnlyMode(false);
    setCurrentView('form');
  };

  const handleViewOrder = (id: string) => {
    setSelectedOrderId(id);
    setIsViewOnlyMode(true);
    setCurrentView('form');
  };

  const handleFormSaved = () => {
    setSelectedOrderId(null);
    setIsViewOnlyMode(false);
    setCurrentView('list');
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      {currentView === 'list' && (
        <ProductionOrdersList onEdit={handleEditOrder} onView={handleViewOrder} />
      )}
      {currentView === 'form' && (
        <ProductionOrderForm 
          orderId={selectedOrderId} 
          isViewOnly={isViewOnlyMode}
          onSaved={handleFormSaved} 
        />
      )}
    </Layout>
  );
}
