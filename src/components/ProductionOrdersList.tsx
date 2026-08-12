import React, { useState, useEffect } from 'react';
import { getOrders } from '../lib/storage';
import { ProductionOrder } from '../types';
import { Search, Edit, Eye, Filter, Trash2 } from 'lucide-react';
import * as Cmd from '../lib/productionOrderCommands';

interface ProductionOrdersListProps {
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

export function ProductionOrdersList({ onEdit, onView }: ProductionOrdersListProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleDelete = (order: ProductionOrder) => {
    if (window.confirm(`هل أنت متأكد من حذف الأمر ${order.orderNumber} نهائياً؟`)) {
      const result = Cmd.deleteProductionOrder(order);
      if (result.success) {
        setOrders(getOrders());
      } else {
        alert(result.error || 'حدث خطأ');
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      order.orderNumber.toLowerCase().includes(term) ||
      order.styleName.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term);
    
    const matchesStatus = statusFilter === 'الكل' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">أوامر الإنتاج</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث برقم الأمر، القصة، أو العميل..."
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative w-full sm:w-48">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="الكل">جميع الحالات</option>
              <option value="مسودة">مسودة</option>
              <option value="أمر إنتاج معتمد">أمر إنتاج معتمد</option>
              <option value="أمر قص">أمر قص</option>
              <option value="القص الفعلي مدخل">القص الفعلي مدخل</option>
              <option value="القص معتمد">القص معتمد</option>
              <option value="تقسيم الباتشات">تقسيم الباتشات</option>
              <option value="الباتشات مثبتة">الباتشات مثبتة</option>
              <option value="التجهيز جاري">التجهيز جاري</option>
              <option value="التجهيز مكتمل">التجهيز مكتمل</option>
              <option value="مغلق">مغلق</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">رقم الأمر</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">التاريخ</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">القصة</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">النوع</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">العميل</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">العدد الإجمالي</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                // Calculate total quantity safely from variants
                const total = order.sizes.reduce((sum, size) => 
                  sum + size.variants.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0)
                , 0);

                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.orderDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{order.styleName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {order.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.customerName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{total}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === 'مسودة' ? 'bg-amber-100 text-amber-700' :
                        ['أمر إنتاج معتمد', 'القص معتمد', 'الباتشات مثبتة', 'التجهيز مكتمل'].includes(order.status) ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'مغلق' ? 'bg-slate-200 text-slate-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'مسودة' ? (
                          <button
                            onClick={() => onEdit(order.id)}
                            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 font-medium text-xs"
                            title="تعديل المسودة"
                          >
                            <Edit className="w-4 h-4" />
                            <span>تعديل</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onView(order.id)}
                            className="text-slate-600 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors inline-flex items-center gap-1 font-medium text-xs"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                            <span>عرض</span>
                          </button>
                        )}
                        {Cmd.canDeleteProductionOrder(order) && (
                          <button
                            onClick={() => handleDelete(order)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors inline-flex items-center gap-1 font-medium text-xs"
                            title="حذف الأمر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  لا توجد أوامر إنتاج مطابقة للبحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
