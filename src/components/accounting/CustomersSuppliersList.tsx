import React, { useState, useEffect } from 'react';
import { CustomerSupplier } from '../../types';
import { getCustomersSuppliers, saveCustomersSuppliers } from '../../lib/accountingStorage';
import { Plus, Edit, Trash2, Search, Users, Phone } from 'lucide-react';

export function CustomersSuppliersList() {
  const [items, setItems] = useState<CustomerSupplier[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all'|'customer'|'supplier'|'both'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CustomerSupplier>>({
    name: '', type: 'customer', phone: '', address: '', isActive: true
  });

  useEffect(() => {
    setItems(getCustomersSuppliers());
  }, []);

  const handleSave = () => {
    if (!formData.name) return;
    let updated = [...items];
    if (editingId) {
      updated = updated.map(a => a.id === editingId ? { ...a, ...formData } as CustomerSupplier : a);
    } else {
      updated.push({ ...formData, id: Date.now().toString() } as CustomerSupplier);
    }
    setItems(updated);
    saveCustomersSuppliers(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if(confirm('هل أنت متأكد من الحذف؟')) {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      saveCustomersSuppliers(updated);
    }
  };

  const filtered = items.filter(a => 
    a.name.includes(search) && (filterType === 'all' || a.type === filterType)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
            />
          </div>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">الكل</option>
            <option value="customer">عملاء فقط</option>
            <option value="supplier">موردين فقط</option>
            <option value="both">عميل ومورد</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: 'customer', phone: '', address: '', isActive: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          إضافة جديد
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-3 font-semibold">الاسم</th>
              <th className="p-3 font-semibold">النوع</th>
              <th className="p-3 font-semibold">رقم الهاتف</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold w-24 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    {item.name}
                  </div>
                </td>
                <td className="p-3 text-slate-600">
                  {item.type === 'customer' ? 'عميل' : item.type === 'supplier' ? 'مورد' : 'عميل ومورد'}
                </td>
                <td className="p-3 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{item.phone || '-'}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setEditingId(item.id); setFormData(item); setShowModal(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد سجلات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل السجل' : 'إضافة سجل جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
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
                  <option value="customer">عميل</option>
                  <option value="supplier">مورد</option>
                  <option value="both">عميل ومورد</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
