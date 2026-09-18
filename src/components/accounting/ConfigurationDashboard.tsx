import React, { useState } from 'react';
import { 
  Network, 
  Users, 
  PackageSearch, 
  HardHat, 
  Building2,
  Settings2
} from 'lucide-react';
import { ChartOfAccounts } from './ChartOfAccounts';
import { CustomersSuppliersList } from './CustomersSuppliersList';
import { MaterialsList } from './MaterialsList';
import { LaborList } from './LaborList';
import { OperationalGroupsList } from './OperationalGroupsList';
import { DepartmentsList } from './DepartmentsList';

type Tab = 'accounts' | 'departments' | 'customers' | 'materials' | 'labor' | 'groups';

export function ConfigurationDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

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
              onClick={() => setActiveTab(tab.id as Tab)}
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
          {activeTab === 'customers' && <CustomersSuppliersList />}
          {activeTab === 'materials' && <MaterialsList />}
          {activeTab === 'labor' && <LaborList />}
          {activeTab === 'departments' && <DepartmentsList />}
          {activeTab === 'groups' && <OperationalGroupsList />}
        </div>
      </div>
    </div>
  );
}
