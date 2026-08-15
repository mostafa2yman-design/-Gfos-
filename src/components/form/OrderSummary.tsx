import React from 'react';
import { SizeData } from '../../types';

interface OrderSummaryProps {
  sizes: SizeData[];
  actualSizes?: SizeData[];
}

export function OrderSummary({ sizes, actualSizes }: OrderSummaryProps) {
  // Compute totals for standard sizes
  const totalSizes = sizes.length;
  const colorTotals: Record<string, number> = {};
  const sizeTotals: Record<string, number> = {};
  let grandTotal = 0;

  sizes.forEach(size => {
    let currentSizeTotal = 0;
    size.variants.forEach(variant => {
      if (variant.color && variant.quantity) {
        const qty = Number(variant.quantity) || 0;
        colorTotals[variant.color] = (colorTotals[variant.color] || 0) + qty;
        currentSizeTotal += qty;
        grandTotal += qty;
      }
    });
    sizeTotals[size.size] = currentSizeTotal;
  });

  const sortedColors = Object.entries(colorTotals).sort((a, b) => b[1] - a[1]);
  const totalColors = sortedColors.length;

  // Compute totals for actual sizes
  const actualColorTotals: Record<string, number> = {};
  const actualSizeTotals: Record<string, number> = {};
  let actualGrandTotal = 0;

  if (actualSizes) {
    actualSizes.forEach(size => {
      let currentSizeTotal = 0;
      size.variants.forEach((variant: any) => {
        const actualQty = variant.actualQuantity !== undefined ? variant.actualQuantity : variant.quantity;
        if (variant.color && actualQty !== undefined) {
          const qty = Number(actualQty) || 0;
          actualColorTotals[variant.color] = (actualColorTotals[variant.color] || 0) + qty;
          currentSizeTotal += qty;
          actualGrandTotal += qty;
        }
      });
      actualSizeTotals[size.size] = currentSizeTotal;
    });
  }

  return (
    <div className="bg-indigo-900 rounded-xl shadow-md overflow-hidden text-white h-full flex flex-col min-h-[500px]">
      <div className="px-6 py-4 bg-indigo-950 border-b border-indigo-800">
        <h3 className="text-lg font-bold">ملخص الأمر</h3>
      </div>
      
      <div className="p-6 flex-1 flex flex-col overflow-y-auto">
        <h4 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-800 pb-2">أولاً — الإجمالي</h4>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700/50 text-center">
            <p className="text-indigo-200 text-xs font-medium mb-1">المقاسات</p>
            <p className="text-xl font-bold">{totalSizes}</p>
          </div>
          <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700/50 text-center">
            <p className="text-indigo-200 text-xs font-medium mb-1">الألوان</p>
            <p className="text-xl font-bold">{totalColors}</p>
          </div>
          <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700/50 text-center">
            <p className="text-indigo-200 text-xs font-medium mb-1">إجمالي القطع</p>
            <p className="text-xl font-bold text-emerald-400">
              {grandTotal}
              {actualSizes && (
                <span className="block text-sm font-medium text-amber-400 mt-1">الفعلي: {actualGrandTotal}</span>
              )}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-800 pb-2">توزيع الكميات حسب المقاس</h4>
          {sizes.length > 0 ? (
            <div className="space-y-2">
              {sizes.map((size) => (
                <div key={size.size} className="flex flex-col bg-indigo-800/30 px-3 py-2 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{size.size}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-700 px-2 py-0.5 rounded text-sm font-bold" title="المطلوب">{sizeTotals[size.size] || 0}</span>
                      {actualSizes && (
                        <span className="bg-amber-600/80 px-2 py-0.5 rounded text-sm font-bold text-white" title="الفعلي">
                          {actualSizeTotals[size.size] || 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-400 text-sm text-center py-2 bg-indigo-800/20 rounded-md border border-indigo-800/50 border-dashed">
              لم يتم إضافة مقاسات بعد
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-800 pb-2">توزيع الكميات حسب اللون</h4>
          {sortedColors.length > 0 ? (
            <div className="space-y-2">
              {sortedColors.map(([color, total]) => (
                <div key={color} className="flex flex-col bg-indigo-800/30 px-3 py-2 rounded-md">
                   <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{color}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-700 px-2 py-0.5 rounded text-sm font-bold" title="المطلوب">{total}</span>
                      {actualSizes && (
                        <span className="bg-amber-600/80 px-2 py-0.5 rounded text-sm font-bold text-white" title="الفعلي">
                          {actualColorTotals[color] || 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-400 text-sm text-center py-2 bg-indigo-800/20 rounded-md border border-indigo-800/50 border-dashed">
              لم يتم إضافة ألوان وكميات بعد
            </p>
          )}
        </div>
        
        {actualSizes && (
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium">
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-700 inline-block"></span> المطلوب</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-600/80 inline-block"></span> الفعلي بعد القص</div>
          </div>
        )}
      </div>
    </div>
  );
}
