import React, { useState, useEffect } from 'react';
import { getCustomersSuppliers } from '../../lib/accountingStorage';
import { CustomerSupplier } from '../../types';
import { CATEGORIES } from '../../types';
import { Calendar, Tag, User, Hash, ChevronDown } from 'lucide-react';

interface OrderBasicInfoProps {
  orderNumber: string;
  orderDate: string;
  styleName: string;
  category: string;
  customerName: string;
  standardCutCostPerPiece?: number;
  printEmbroideryStandardCost?: number;
  standardSewingCostPerPiece?: number;
  standardFinishingCostPerPiece?: number;
  standardIroningCostPerPiece?: number;
  sellingPrice?: number;
  finishingInstructions?: string;
  ironingInstructions?: string;
  packingInstructions?: string;
  onChange: (field: string, value: string) => void;
  readOnly?: boolean;
}

export function OrderBasicInfo({
  orderNumber,
  orderDate,
  styleName,
  category,
  customerName,
  standardCutCostPerPiece,
  printEmbroideryStandardCost,
  standardSewingCostPerPiece,
  standardFinishingCostPerPiece,
  standardIroningCostPerPiece,
  sellingPrice,
  finishingInstructions,
  ironingInstructions,
  packingInstructions,
  onChange,
  readOnly = false
}: OrderBasicInfoProps) {
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  useEffect(() => {
    const list = getCustomersSuppliers();
    setCustomers(list.filter(c => c.type === 'customer' || c.type === 'both' && c.isActive));
  }, []);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">بيانات الأمر الأساسية</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="relative">
              <select
                value={category}
                disabled={readOnly}
                onChange={(e) => onChange('category', e.target.value)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg appearance-none pr-3 pl-8 transition-shadow ${
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
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              اسم العميل {!readOnly && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              
              <div className="relative w-full">
                <select
                  value={customerName}
                  disabled={readOnly}
                  onChange={(e) => onChange('customerName', e.target.value)}
                  className={`w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg transition-shadow appearance-none ${
                    readOnly 
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                      : 'bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                >
                  <option value="">أدخل اسم العميل / بدون</option>
                  <option value="المصنع">المصنع</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

            </div>
          </div>

          
          {/* Cut Standard Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              التكلفة المعيارية للقص للقطعة
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={standardCutCostPerPiece ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('standardCutCostPerPiece', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                جنيه
              </span>
            </div>
          </div>

          {/* Print/Embroidery Standard Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              تكلفة الطباعة/التطريز المعيارية للقطعة
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={printEmbroideryStandardCost ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('printEmbroideryStandardCost', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                جنيه
              </span>
            </div>
          </div>
          {/* Sewing Standard Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              تكلفة الخياطة المعيارية للقطعة
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={standardSewingCostPerPiece ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('standardSewingCostPerPiece', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                جنيه
              </span>
            </div>
          </div>
          
          {/* Standard Finishing Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              التكلفة المعيارية للتشطيب للقطعة
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={standardFinishingCostPerPiece ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('standardFinishingCostPerPiece', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                جنيه
              </span>
            </div>
          </div>
        </div>
        
        
          {/* Standard Ironing Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              التكلفة المعيارية للمكواة للقطعة
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={standardIroningCostPerPiece ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('standardIroningCostPerPiece', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                جنيه
              </span>
            </div>
          </div>

          {/* Finishing Instructions */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            تعليمات التشطيب
          </label>
          <textarea
            value={finishingInstructions ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange('finishingInstructions', e.target.value)}
            placeholder="مثال: تركيب زرار إضافي، كي بالبخار..."
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg transition-shadow ${
              readOnly 
                ? 'bg-slate-50 text-slate-700 border-slate-300 cursor-not-allowed' 
                : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
