cat << 'INNEREOF' > src/components/OrderManager.tsx
import React, { useState, useEffect } from 'react';
import { ProductionOrderForm } from './ProductionOrderForm';
import { CutOrderForm } from './CutOrderForm';
import { BatchesForm } from './BatchesForm';
import { PrintPrepSheet } from './PrintPrepSheet';
import { ProductionOrder, OrderStatus } from '../types';
import { getOrderById } from '../lib/storage';
import { ArrowRight, Scissors, FileText, Layers, CheckSquare } from 'lucide-react';

interface OrderManagerProps {
  orderId: string | null;
  onBack: () => void;
}

type TabType = 'production' | 'cut' | 'batches' | 'prep';

export function OrderManager({ orderId: initialOrderId, onBack }: OrderManagerProps) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(initialOrderId);
  const [activeTab, setActiveTab] = useState<TabType>('production');
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  const loadOrder = (id: string | null, forceTabChange = true) => {
    if (id) {
      const found = getOrderById(id);
      if (found) {
        setOrder(found);
        
        if (forceTabChange) {
          // Auto-select tab based on status if opening
          if (found.status === 'أمر قص' || found.status === 'القص الفعلي مدخل') {
            setActiveTab('cut');
          } else if (found.status === 'القص معتمد' || found.status === 'تقسيم الباتشات') {
            setActiveTab('batches');
          } else if (found.status === 'الباتشات مثبتة' || found.status === 'التجهيز جاري' || found.status === 'التجهيز مكتمل') {
            setActiveTab('prep');
          } else {
            setActiveTab('production');
          }
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

  if (!currentOrderId) {
    // New order
    return (
      <ProductionOrderForm 
        orderId={null} 
        isViewOnly={false} 
        onOrderSaved={(id) => setCurrentOrderId(id)}
        onOrderApproved={(id) => {
          setCurrentOrderId(id);
          setActiveTab('cut');
        }}
        onDeleted={onBack}
        onBack={onBack}
      />
    );
  }

  if (!order) return <div className="p-8 text-center">جاري التحميل...</div>;

  const isCutEnabled = ['أمر إنتاج معتمد', 'أمر قص', 'القص الفعلي مدخل', 'القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status);
  const isBatchesEnabled = ['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status);
  const isPrepEnabled = ['الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status);

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
          onClick={() => setActiveTab('production')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'production' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          أمر الإنتاج والخامات
        </button>
        <button
          disabled={!isCutEnabled}
          onClick={() => setActiveTab('cut')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'cut' ? 'bg-indigo-50 text-indigo-700' : 
            !isCutEnabled ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Scissors className="w-5 h-5" />
          أمر القص الفعلي
        </button>
        <button
          disabled={!isBatchesEnabled}
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'batches' ? 'bg-indigo-50 text-indigo-700' : 
            !isBatchesEnabled ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-5 h-5" />
          تقسيم الباتشات
        </button>
        <button
          disabled={!isPrepEnabled}
          onClick={() => setActiveTab('prep')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'prep' ? 'bg-indigo-50 text-indigo-700' : 
            !isPrepEnabled ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          شيت الطباعة والتجهيز
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {activeTab === 'production' && (
          <ProductionOrderForm 
            orderId={currentOrderId} 
            isViewOnly={isCutEnabled} 
            onOrderSaved={(id) => loadOrder(id, false)} 
            onOrderApproved={(id) => {
              loadOrder(id, false);
              setActiveTab('cut');
            }}
            onDeleted={onBack}
            onBack={onBack}
          />
        )}
        {activeTab === 'cut' && (
          <CutOrderForm 
            orderId={currentOrderId} 
            onSaved={() => loadOrder(currentOrderId, false)} 
          />
        )}
        {activeTab === 'batches' && (
          <BatchesForm 
            orderId={currentOrderId} 
            onSaved={() => loadOrder(currentOrderId, false)} 
          />
        )}
        {activeTab === 'prep' && (
          <PrintPrepSheet 
            orderId={currentOrderId} 
            onSaved={() => loadOrder(currentOrderId, false)} 
          />
        )}
      </div>
    </div>
  );
}
INNEREOF
