import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductionOrdersList } from './components/ProductionOrdersList';
import { OrderManager } from './components/OrderManager';
import { ProductionOrderForm } from './components/ProductionOrderForm';
import { initializeDummyData } from './lib/storage';

type ViewState = 'dashboard' | 'list' | 'form';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    initializeDummyData();
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== 'form') {
      setSelectedOrderId(null);
    }
  };

  const handleEditOrder = (id: string) => {
    setSelectedOrderId(id);
    setCurrentView('form');
  };

  const handleViewOrder = (id: string) => {
    setSelectedOrderId(id);
    setCurrentView('form');
  };

  const handleFormSaved = () => {
    setSelectedOrderId(null);
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
      {currentView === 'form' && selectedOrderId ? (
        <OrderManager 
          orderId={selectedOrderId} 
          onSaved={handleFormSaved}
          onBack={() => handleNavigate('list')}
        />
      ) : currentView === 'form' ? (
        <ProductionOrderForm 
          orderId={null} 
          isViewOnly={false}
          onSaved={handleFormSaved} 
        />
      ) : null}
    </Layout>
  );
}

