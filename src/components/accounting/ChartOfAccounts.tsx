import React, { useState, useEffect } from 'react';
import { AccountNode } from '../../types';
import { getAccounts, saveAccounts } from '../../lib/accountingStorage';
import { Plus, Edit, Trash2, Search, Network } from 'lucide-react';

// Basic initial COA if empty
const INITIAL_ACCOUNTS: AccountNode[] = [
  { id: '1', code: '1000', name: 'الأصول', type: 'asset', isActive: true },
  { id: '11', code: '1100', name: 'الأصول المتداولة', type: 'asset', parentId: '1', isActive: true },
  { id: '111', code: '1101', name: 'النقدية بالخزينة', type: 'asset', parentId: '11', isActive: true },
  { id: '112', code: '1102', name: 'البنوك', type: 'asset', parentId: '11', isActive: true },
  { id: '2', code: '2000', name: 'الخصوم', type: 'liability', isActive: true },
  { id: '3', code: '3000', name: 'حقوق الملكية', type: 'equity', isActive: true },
  { id: '4', code: '4000', name: 'الإيرادات', type: 'revenue', isActive: true },
  { id: '5', code: '5000', name: 'المصروفات', type: 'expense', isActive: true },
  { id: '51', code: '5100', name: 'مصروفات التشغيل', type: 'expense', parentId: '5', isActive: true },
  { id: '52', code: '5200', name: 'مصروفات عمومية وإدارية', type: 'expense', parentId: '5', isActive: true }
];

export function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<AccountNode>>({
    code: '', name: '', type: 'asset', parentId: '', isActive: true
  });

  useEffect(() => {
    let saved = getAccounts();
    if (saved.length === 0) {
      saved = INITIAL_ACCOUNTS;
      saveAccounts(saved);
    }
    setAccounts(saved);
  }, []);

  const handleSave = () => {
    if (!formData.code || !formData.name) return;

    let updated = [...accounts];
    if (editingId) {
      updated = updated.map(a => a.id === editingId ? { ...a, ...formData } as AccountNode : a);
    } else {
      updated.push({
        ...formData,
        id: Date.now().toString()
      } as AccountNode);
    }

    setAccounts(updated);
    saveAccounts(updated);
    setShowModal(false);
  };

  const handleEdit = (acc: AccountNode) => {
    setEditingId(acc.id);
    setFormData(acc);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      const updated = accounts.filter(a => a.id !== id);
      setAccounts(updated);
      saveAccounts(updated);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', type: 'asset', parentId: '', isActive: true });
    setShowModal(true);
  };

  const filtered = accounts.filter(a => 
    a.name.includes(search) || a.code.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث بالكود أو اسم الحساب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
          />
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة حساب جديد
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-3 font-semibold">كود الحساب</th>
              <th className="p-3 font-semibold">اسم الحساب</th>
              <th className="p-3 font-semibold">النوع</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold w-24 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(acc => (
              <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-medium text-slate-900">{acc.code}</td>
                <td className="p-3 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-slate-400" />
                    {acc.name}
                  </div>
                </td>
                <td className="p-3 text-slate-600">{acc.type}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${acc.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {acc.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleEdit(acc)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(acc.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد حسابات مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل حساب' : 'إضافة حساب جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كود الحساب</label>
                <input 
                  type="text" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الحساب</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="asset">أصول</option>
                  <option value="liability">خصوم</option>
                  <option value="equity">حقوق ملكية</option>
                  <option value="revenue">إيرادات</option>
                  <option value="expense">مصروفات</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">حساب نشط</label>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">إلغاء</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">حفظ الحساب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
