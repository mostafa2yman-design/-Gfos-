import React from 'react';
import { SizeData } from '../../types';

interface OrderSummaryProps {
  sizes: SizeData[];
}

export function OrderSummary({ sizes }: OrderSummaryProps) {
  // Compute totals
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
            <p className="text-xl font-bold text-emerald-400">{grandTotal}</p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-800 pb-2">توزيع الكميات حسب المقاس</h4>
          {sizes.length > 0 ? (
            <div className="space-y-2">
              {sizes.map((size) => (
                <div key={size.size} className="flex items-center justify-between bg-indigo-800/30 px-3 py-2 rounded-md">
                  <span className="font-medium text-slate-200">{size.size}</span>
                  <span className="bg-indigo-700 px-2 py-0.5 rounded text-sm font-bold">{sizeTotals[size.size] || 0}</span>
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
                <div key={color} className="flex items-center justify-between bg-indigo-800/30 px-3 py-2 rounded-md">
                  <span className="font-medium text-slate-200">{color}</span>
                  <span className="bg-indigo-700 px-2 py-0.5 rounded text-sm font-bold">{total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-400 text-sm text-center py-2 bg-indigo-800/20 rounded-md border border-indigo-800/50 border-dashed">
              لم يتم إضافة ألوان وكميات بعد
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
