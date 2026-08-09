import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductionOrdersList } from './components/ProductionOrdersList';
import { ProductionOrderForm } from './components/ProductionOrderForm';
import { initializeDummyData } from './lib/storage';

type ViewState = 'dashboard' | 'list' | 'form';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize dummy data when the app loads (per requirements)
    initializeDummyData();
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== 'form') {
      setEditingOrderId(null);
    }
  };

  const handleEditOrder = (id: string) => {
    setEditingOrderId(id);
    setCurrentView('form');
  };

  const handleFormSaved = () => {
    setEditingOrderId(null);
    setCurrentView('list');
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      {currentView === 'list' && (
        <ProductionOrdersList onEdit={handleEditOrder} />
      )}
      {currentView === 'form' && (
        <ProductionOrderForm 
          orderId={editingOrderId} 
          onSaved={handleFormSaved} 
        />
      )}
    </Layout>
  );
}
