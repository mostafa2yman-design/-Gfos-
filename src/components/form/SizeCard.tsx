import React, { useState, useRef, useEffect } from 'react';
import { SizeData, PREDEFINED_COLORS, Variant } from '../../types';
import { VariantRow } from './VariantRow';
import { Plus, Trash2, Copy } from 'lucide-react';

interface SizeCardProps {
  key?: React.Key;
  sizeData: SizeData;
  availableSizesToCopy: string[];
  onUpdateVariant: (variantIndex: number, field: keyof Variant, value: string | number) => void;
  onAddVariant: () => void;
  onRemoveVariant: (variantIndex: number) => void;
  onRemoveSize: () => void;
  onCopySize: (targetSize: string) => void;
  readOnly?: boolean;
}

export function SizeCard({
  sizeData,
  availableSizesToCopy,
  onUpdateVariant,
  onAddVariant,
  onRemoveVariant,
  onRemoveSize,
  onCopySize,
  readOnly = false
}: SizeCardProps) {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const copyModalRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showCopyModal) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (copyModalRef.current && !copyModalRef.current.contains(event.target as Node)) {
        setShowCopyModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCopyModal]);

  // Calculate size total directly from the variants
  const sizeTotal = sizeData.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  // Colors that are not yet selected in this size
  const selectedColors = sizeData.variants.map(v => v.color).filter(Boolean);
  const availableColors = PREDEFINED_COLORS.filter(c => !selectedColors.includes(c));

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-lg">
            {sizeData.size}
          </div>
          <div>
            <h4 className="font-bold text-slate-800">المقاس {sizeData.size}</h4>
            <p className="text-xs text-slate-500">
              إجمالي المقاس: <span className="font-bold text-indigo-600">{sizeTotal}</span> قطعة
            </p>
          </div>
        </div>
        
        {!readOnly && (
          <div className="flex items-center gap-2">
            {sizeData.variants.length > 0 && availableSizesToCopy.length > 0 && (
              <div className="relative" ref={copyModalRef}>
                <button
                  type="button"
                  onClick={() => setShowCopyModal(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md transition-colors font-medium shadow-xs"
                >
                  <Copy className="w-4 h-4" />
                  نسخ المقاس
                </button>
                
                {showCopyModal && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                      نسخ إلى مقاس:
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {availableSizesToCopy.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            onCopySize(sz);
                            setShowCopyModal(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          المقاس {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`هل أنت متأكد من حذف المقاس ${sizeData.size} بالكامل؟`)) {
                  onRemoveSize();
                }
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="حذف المقاس"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-5 space-y-3">
        {sizeData.variants.map((variant, idx) => (
          <VariantRow
            key={idx}
            variant={variant}
            availableColors={availableColors}
            onChange={(field, value) => onUpdateVariant(idx, field, value)}
            onRemove={() => onRemoveVariant(idx)}
            readOnly={readOnly}
          />
        ))}

        {!readOnly && availableColors.length > 0 && (
          <button
            type="button"
            onClick={onAddVariant}
            className="flex items-center justify-center gap-2 w-full py-3 mt-4 border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            إضافة لون
          </button>
        )}
      </div>
    </div>
  );
}
