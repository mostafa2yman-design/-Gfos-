import React from 'react';
import { CATEGORIES } from '../../types';
import { Calendar, Tag, User, Hash } from 'lucide-react';

interface OrderBasicInfoProps {
  orderNumber: string;
  orderDate: string;
  styleName: string;
  category: string;
  customerName: string;
  onChange: (field: string, value: string) => void;
  readOnly?: boolean;
}

export function OrderBasicInfo({
  orderNumber,
  orderDate,
  styleName,
  category,
  customerName,
  onChange,
  readOnly = false
}: OrderBasicInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">بيانات الأمر الأساسية</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              رقم الأمر
            </label>
            <div className="relative">
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={orderNumber}
                disabled
                className="w-full pl-3 pr-10 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              التاريخ
            </label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                value={orderDate}
                disabled
                className="w-full pl-3 pr-10 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          {/* Style Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              اسم القصة {!readOnly && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={styleName}
                disabled={readOnly}
                onChange={(e) => onChange('styleName', e.target.value)}
                placeholder="أدخل اسم القصة..."
                className={`w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg transition-shadow ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                    : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              نوع القصة {!readOnly && <span className="text-red-500">*</span>}
            </label>
            <select
              value={category}
              disabled={readOnly}
              onChange={(e) => onChange('category', e.target.value)}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg appearance-none transition-shadow ${
                readOnly 
                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                  : 'bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            >
              <option value="" disabled>اختر النوع...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              اسم العميل {!readOnly && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={customerName}
                disabled={readOnly}
                onChange={(e) => onChange('customerName', e.target.value)}
                placeholder="أدخل اسم العميل..."
                className={`w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg transition-shadow ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                    : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
