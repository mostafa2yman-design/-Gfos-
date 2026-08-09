import React from 'react';
import { Variant } from '../../types';
import { Trash2 } from 'lucide-react';

interface VariantRowProps {
  variant: Variant;
  availableColors: string[];
  onChange: (field: keyof Variant, value: string | number) => void;
  onRemove: () => void;
}

export function VariantRow({ variant, availableColors, onChange, onRemove }: VariantRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
      <div className="flex-1">
        <select
          value={variant.color}
          onChange={(e) => onChange('color', e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
        >
          {variant.color && <option value={variant.color}>{variant.color}</option>}
          <option value="" disabled>اختر اللون...</option>
          {availableColors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      
      <div className="w-32">
        <div className="relative">
          <input
            type="number"
            min="1"
            value={variant.quantity || ''}
            onChange={(e) => onChange('quantity', parseInt(e.target.value, 10) || 0)}
            placeholder="الكمية"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
        title="حذف اللون"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
