import React, { useState, useEffect } from 'react';
import { Variant } from '../../types';
import { Trash2, X, Check } from 'lucide-react';
import { addCustomColor } from '../../lib/colors';

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
  const [tempColor, setTempColor] = useState('');

  // When variant.color changes externally (and it's not custom typing mode), reset tempColor
  useEffect(() => {
    if (!isCustom) {
      setTempColor(variant.color || '');
    }
  }, [variant.color, isCustom]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'CUSTOM_COLOR_ENTRY') {
      setIsCustom(true);
      setTempColor('');
    } else {
      onChange('color', e.target.value);
    }
  };

  const handleConfirmCustomColor = () => {
    const trimmed = tempColor.trim();
    if (trimmed) {
      addCustomColor(trimmed);
      onChange('color', trimmed);
    }
    setIsCustom(false);
  };

  const handleCancelCustomColor = () => {
    setIsCustom(false);
    setTempColor(variant.color || '');
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 mb-1 sm:hidden">اللون</label>
        {isCustom ? (
          <div className="relative flex items-center">
            <input
              type="text"
              value={tempColor}
              disabled={readOnly}
              onChange={(e) => setTempColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmCustomColor();
                } else if (e.key === 'Escape') {
                  handleCancelCustomColor();
                }
              }}
              placeholder="اكتب اسم اللون هنا..."
              autoFocus
              className={`w-full pr-3 pl-16 py-2 border border-slate-300 rounded-md text-sm font-medium ${
                readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {!readOnly && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleConfirmCustomColor}
                  disabled={!tempColor.trim()}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md disabled:opacity-50 transition-colors"
                  title="تأكيد اللون"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelCustomColor}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="إلغاء والعودة للقائمة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
            {variant.color && !availableColors.includes(variant.color) && (
              <option value={variant.color}>{variant.color}</option>
            )}
            {!readOnly && !variant.color && <option value="" disabled>اختر اللون...</option>}
            
            {!readOnly && (
              <option value="CUSTOM_COLOR_ENTRY" className="font-bold bg-indigo-50 text-indigo-700">
                -- إدخال لون يدوياً --
              </option>
            )}
            
            {/* Show available predefined/saved colors */}
            {availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
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
            onChange={(e) => onChange('quantity', (() => { const v = parseInt(e.target.value, 10); return isNaN(v) ? 0 : v; })())}
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
