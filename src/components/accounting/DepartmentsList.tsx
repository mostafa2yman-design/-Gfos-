import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Network } from 'lucide-react';
import { Department } from '../../types';
import { getDepartments, saveDepartments } from '../../lib/accountingStorage';

export function DepartmentsList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});

  useEffect(() => {
    setDepartments(getDepartments());
  }, []);

  const handleSave = () => {
    if (!formData.name) return;

    let updated: Department[];
    if (editingId) {
      updated = departments.map(d => 
        d.id === editingId 
          ? { ...d, ...formData } as Department
          : d
      );
    } else {
      const newDept: Department = {
        id: 'dept_' + Date.now().toString(),
        name: formData.name,
        description: formData.description || '',
        createdAt: new Date().toISOString()
      };
      updated = [...departments, newDept];
    }

    saveDepartments(updated);
    setDepartments(updated);
    setShowModal(false);
    setFormData({});
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      const updated = departments.filter(d => d.id !== id);
      saveDepartments(updated);
      setDepartments(updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">إدارة الأقسام</h3>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({});
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة قسم
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-3 font-medium">اسم القسم</th>
              <th className="p-3 font-medium">الوصف</th>
              <th className="p-3 font-medium">تاريخ الإنشاء</th>
              <th className="p-3 font-medium text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {departments.map(dept => (
              <tr key={dept.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">
                   <div className="flex items-center gap-2">
                     <Network className="w-4 h-4 text-indigo-500" />
                     {dept.name}
                   </div>
                </td>
                <td className="p-3 text-slate-600">{dept.description || '-'}</td>
                <td className="p-3 text-slate-600">{new Date(dept.createdAt).toLocaleDateString('ar-EG')}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(dept.id);
                        setFormData(dept);
                        setShowModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">لا توجد أقسام مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم القسم</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="مثال: قسم القص"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف (اختياري)</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={3}
                />
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
