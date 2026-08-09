import React from 'react';
import { SizeData } from '../../types';

interface OrderSummaryProps {
  sizes: SizeData[];
}

export function OrderSummary({ sizes }: OrderSummaryProps) {
  // Compute totals
  const totalSizes = sizes.length;
  
  const colorTotals: Record<string, number> = {};
  let grandTotal = 0;

  sizes.forEach(size => {
    size.variants.forEach(variant => {
      if (variant.color && variant.quantity) {
        const qty = Number(variant.quantity) || 0;
        colorTotals[variant.color] = (colorTotals[variant.color] || 0) + qty;
        grandTotal += qty;
      }
    });
  });

  const sortedColors = Object.entries(colorTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-indigo-900 rounded-xl shadow-md overflow-hidden text-white h-full flex flex-col min-h-[500px]">
      <div className="px-6 py-4 bg-indigo-950 border-b border-indigo-800">
        <h3 className="text-lg font-bold">ملخص الأمر</h3>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-800/50 p-4 rounded-lg border border-indigo-700/50">
            <p className="text-indigo-200 text-sm font-medium mb-1">عدد المقاسات</p>
            <p className="text-3xl font-bold">{totalSizes}</p>
          </div>
          <div className="bg-indigo-800/50 p-4 rounded-lg border border-indigo-700/50">
            <p className="text-indigo-200 text-sm font-medium mb-1">إجمالي القطع</p>
            <p className="text-3xl font-bold">{grandTotal}</p>
          </div>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-800 pb-2">تفصيل الكميات حسب اللون</h4>
          {sortedColors.length > 0 ? (
            <div className="space-y-2">
              {sortedColors.map(([color, total]) => (
                <div key={color} className="flex items-center justify-between bg-indigo-800/30 px-3 py-2 rounded-md">
                  <span className="font-medium">{color}</span>
                  <span className="bg-indigo-700 px-2 py-0.5 rounded text-sm font-bold">{total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-400 text-sm text-center py-4 bg-indigo-800/20 rounded-md border border-indigo-800/50 border-dashed">
              لم يتم إضافة ألوان وكميات بعد
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
