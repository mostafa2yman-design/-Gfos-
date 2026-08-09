import React, { useEffect, useState } from 'react';
import { getOrders } from '../lib/storage';
import { ProductionOrder } from '../types';
import { FileText, ClipboardList, CheckCircle2, Archive, ArrowLeft } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'list' | 'form') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const stats = [
    {
      title: 'إجمالي الأوامر',
      value: orders.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      title: 'مسودات',
      value: orders.filter(o => o.status === 'مسودة').length,
      icon: ClipboardList,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100'
    },
    {
      title: 'معتمدة',
      value: orders.filter(o => o.status === 'معتمد').length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      title: 'مغلقة',
      value: orders.filter(o => o.status === 'مغلق').length,
      icon: Archive,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">لوحة التحكم</h2>
          <p className="text-slate-500 mt-1">نظرة عامة على أوامر الإنتاج الأولي</p>
        </div>
        <button
          onClick={() => onNavigate('form')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-medium"
        >
          <span>إنشاء أمر إنتاج أولي</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white rounded-xl border ${stat.borderColor} p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
