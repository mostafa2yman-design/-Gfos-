with open('src/components/form/VariantRow.tsx', 'w') as f:
    f.write("""import React, { useState } from 'react';
import { Variant } from '../../types';
import { Trash2, X } from 'lucide-react';

interface VariantRowProps {
  key?: React.Key;
  variant: Variant;
  availableColors: string[];
  onChange: (field: keyof Variant, value: string | number) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function VariantRow({ variant, availableColors, onChange, onRemove, readOnly = false }: VariantRowProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'CUSTOM_COLOR_ENTRY') {
      setIsCustom(true);
      onChange('color', '');
    } else {
      onChange('color', e.target.value);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 mb-1 sm:hidden">اللون</label>
        {isCustom ? (
          <div className="relative">
            <input
              type="text"
              value={variant.color}
              disabled={readOnly}
              onChange={(e) => onChange('color', e.target.value)}
              placeholder="اكتب اللون هنا..."
              autoFocus
              className={`w-full pr-3 pl-8 py-2 border border-slate-300 rounded-md text-sm font-medium ${
                readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => { setIsCustom(false); onChange('color', ''); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="إلغاء وإلعودة للقائمة"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <select
            value={variant.color}
            disabled={readOnly}
            onChange={handleSelectChange}
            className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium ${
              readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'
            }`}
          >
            {variant.color && <option value={variant.color}>{variant.color}</option>}
            {!readOnly && !variant.color && <option value="" disabled>اختر اللون...</option>}
            {!readOnly && availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
            {!readOnly && <option value="CUSTOM_COLOR_ENTRY" className="font-bold bg-indigo-50 text-indigo-700">-- إدخال لون يدوياً --</option>}
          </select>
        )}
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
""")
print("Done")
