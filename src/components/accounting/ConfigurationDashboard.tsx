import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Users, 
  PackageSearch, 
  HardHat, 
  Building2,
  Settings2,
  ArrowLeft,
  ArrowRight,
  Package
} from 'lucide-react';
import { ChartOfAccounts } from './ChartOfAccounts';
import { CustomersSuppliersList } from './CustomersSuppliersList';
import { MaterialsList } from './MaterialsList';
import { LaborList } from './LaborList';
import { OperationalGroupsList } from './OperationalGroupsList';
import { DepartmentsList } from './DepartmentsList';

export type AccountingTab = 'accounts' | 'departments' | 'customers' | 'materials' | 'labor' | 'groups';

interface ConfigurationDashboardProps {
  initialTab?: AccountingTab;
  autoOpenAddCustomer?: boolean;
  returnDestination?: { orderId: string; tab: string; orderNumber?: string } | null;
  onReturn?: () => void;
}

export function ConfigurationDashboard({
  initialTab = 'accounts',
  autoOpenAddCustomer = false,
  returnDestination,
  onReturn,
}: ConfigurationDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState<AccountingTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    { id: 'accounts', label: 'شجرة الحسابات', icon: Network },
    { id: 'departments', label: 'الأقسام', icon: Building2 },
    { id: 'customers', label: 'العملاء والموردين', icon: Users },
    { id: 'materials', label: 'خامات القماش والاكسسوارات', icon: PackageSearch },
    { id: 'labor', label: 'العمالة', icon: HardHat },
    { id: 'groups', label: 'مجموعات التشغيل', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Return to Packing Order banner if user was directed here */}
      {returnDestination && onReturn && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-950 text-sm">
                  تم الانتقال من شاشة التغليف
                </span>
                {returnDestination.orderNumber && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-bold border border-indigo-200">
                    أمر رقم: {returnDestination.orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-800 mt-0.5">
                يمكنك الآن إضافة أو إدارة بيانات العملاء، وعند الانتهاء اضغط على زر العودة لمتابعة تجهيز الفاتورة
              </p>
            </div>
          </div>
          <button
            onClick={onReturn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all hover:shadow-md whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <span>العودة إلى شاشة التغليف</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center shrink-0">
             <Settings2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">التكوين الهيكلي والمالي</h2>
            <p className="text-slate-500 mt-1">
              إدارة شجرة الحسابات، العملاء، الخامات، العمالة ومجموعات التشغيل
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AccountingTab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'accounts' && <ChartOfAccounts />}
          {activeTab === 'customers' && <CustomersSuppliersList autoOpenAddModal={autoOpenAddCustomer} />}
          {activeTab === 'materials' && <MaterialsList />}
          {activeTab === 'labor' && <LaborList />}
          {activeTab === 'departments' && <DepartmentsList />}
          {activeTab === 'groups' && <OperationalGroupsList />}
        </div>
      </div>
    </div>
  );
}
