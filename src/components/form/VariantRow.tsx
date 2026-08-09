import React from 'react';
import { Variant } from '../../types';
import { Trash2 } from 'lucide-react';

interface VariantRowProps {
  key?: React.Key;
  variant: Variant;
  availableColors: string[];
  onChange: (field: keyof Variant, value: string | number) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function VariantRow({ variant, availableColors, onChange, onRemove, readOnly = false }: VariantRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 mb-1 sm:hidden">اللون</label>
        <select
          value={variant.color}
          disabled={readOnly}
          onChange={(e) => onChange('color', e.target.value)}
          className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium ${
            readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'
          }`}
        >
          {variant.color && <option value={variant.color}>{variant.color}</option>}
          {!readOnly && <option value="" disabled>اختر اللون...</option>}
          {!readOnly && availableColors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      
      <div className="w-32">
        <label className="block text-xs font-semibold text-slate-500 mb-1 sm:hidden">الكمية</label>
        <div className="relative">
          <input
            type="number"
            min="1"
            disabled={readOnly}
            value={variant.quantity || ''}
            onChange={(e) => onChange('quantity', parseInt(e.target.value, 10) || 0)}
            placeholder="الكمية"
            className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm ${
              readOnly ? 'bg-slate-100 text-slate-700 font-semibold cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'
            }`}
          />
        </div>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
          title="حذف اللون"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
