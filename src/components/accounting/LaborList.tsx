import React, { useState, useEffect } from 'react';
import { LaborProfile } from '../../types';
import { getLabor, saveLabor, getOperationalGroups } from '../../lib/accountingStorage';
import { OperationalGroup } from '../../types';
import { Plus, Edit, Trash2, Search, HardHat, Phone } from 'lucide-react';

export function LaborList() {
  const [items, setItems] = useState<LaborProfile[]>([]);
  const [groups, setGroups] = useState<OperationalGroup[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<LaborProfile>>({
    name: '', role: 'عامل خياطة', phone: '', baseSalary: 0, isActive: true, salaryType: 'يومية', salaryPeriod: 'يومي', dailyWorkingHours: 8
  });

  useEffect(() => {
    setItems(getLabor());
    setGroups(getOperationalGroups());
  }, []);

  const handleSave = () => {
    if (!formData.name) return;
    let updated = [...items];
    if (editingId) {
      updated = updated.map(a => a.id === editingId ? { ...a, ...formData } as LaborProfile : a);
    } else {
      updated.push({ ...formData, id: Date.now().toString() } as LaborProfile);
    }
    setItems(updated);
    saveLabor(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if(confirm('هل أنت متأكد من الحذف؟')) {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      saveLabor(updated);
    }
  };

  const filtered = items.filter(a => a.name.includes(search));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
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
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', role: 'عامل خياطة', phone: '', baseSalary: 0, isActive: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          إضافة عامل جديد
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-3 font-semibold">الاسم</th>
              <th className="p-3 font-semibold">القسم</th>
              <th className="p-3 font-semibold">المجموعة</th>
              <th className="p-3 font-semibold">رقم الهاتف</th>
              <th className="p-3 font-semibold">نوع الراتب</th>
              <th className="p-3 font-semibold">الدورية</th>
              <th className="p-3 font-semibold">الساعات</th>
              <th className="p-3 font-semibold">القيمة</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold w-24 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-slate-400" />
                    {item.name}
                  </div>
                </td>
                <td className="p-3 text-slate-600">{item.role}</td>
                <td className="p-3 text-slate-600">{groups.find(g => g.id === item.operationalGroupId)?.name || '-'}</td>
                <td className="p-3 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{item.phone || '-'}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600">{item.salaryType || 'يومية'}</td>
                <td className="p-3 text-slate-600">{item.salaryPeriod || 'يومي'}</td>
                <td className="p-3 text-slate-600">{item.dailyWorkingHours || '-'}</td>
                <td className="p-3 font-medium text-indigo-700">{item.baseSalary} جنيه</td>
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
                <td colSpan={10} className="p-8 text-center text-slate-500">لا توجد سجلات عمالة مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل السجل' : 'إضافة عامل جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">القسم</label>
                  <select 
                    value={formData.role || ''} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="عامل قص">عامل قص</option>
                    <option value="عامل تجهيز">عامل تجهيز</option>
                    <option value="عامل خياطة">عامل خياطة</option>
                    <option value="عامل تشطيب">عامل تشطيب</option>
                    <option value="عامل تجهيز وتشطيب">عامل تجهيز وتشطيب</option>
                    <option value="عامل مكواة">عامل مكواة</option>
                    <option value="عامل تشطيب ومكواة">عامل تشطيب ومكواة</option>
                    <option value="عامل تعبئة">عامل تعبئة</option>
                    <option value="مشرف">مشرف</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المجموعة التابع لها</label>
                <select 
                  value={formData.operationalGroupId || ''} 
                  onChange={e => setFormData({...formData, operationalGroupId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">بدون مجموعة</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الراتب</label>
                  <select 
                    value={formData.salaryType || 'يومية'} 
                    onChange={e => setFormData({...formData, salaryType: e.target.value as 'يومية' | 'بالقطعة'})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="يومية">يومية</option>
                    <option value="بالقطعة">بالقطعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">دورية الراتب</label>
                  <select 
                    value={formData.salaryPeriod || 'يومي'} 
                    onChange={e => setFormData({...formData, salaryPeriod: e.target.value as 'يومي' | 'أسبوعي' | 'شهري'})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="يومي">يومي</option>
                    <option value="أسبوعي">أسبوعي</option>
                    <option value="شهري">شهري</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ساعات العمل اليومية</label>
                  <input 
                    type="number" 
                    value={formData.dailyWorkingHours || 8} 
                    onChange={e => setFormData({...formData, dailyWorkingHours: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">قيمة الراتب</label>
                  <input 
                    type="number" 
                    value={formData.baseSalary || 0} 
                    onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive !== false} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">عامل نشط</label>
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
