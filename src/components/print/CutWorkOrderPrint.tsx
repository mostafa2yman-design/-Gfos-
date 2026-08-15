import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';

interface Props {
  order: ProductionOrder;
}

export const CutWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  return (
    <div ref={ref} className="gfos-print-document print-only hidden print:block text-black bg-white" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">أمر تشغيل قص</h1>
          <p className="text-sm text-slate-600 mt-1">رقم الأمر: {order.orderNumber}</p>
        </div>
        <div className="text-left">
          <p className="text-sm font-bold">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
          <p className="text-sm">الموديل: {order.modelName}</p>
          <p className="text-sm">العميل: {order.clientName}</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="mb-6 border border-slate-300 rounded p-4">
        <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">بيانات أساسية</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">نوع القماش:</span> {order.fabricType}</div>
          <div><span className="font-medium">وزن القماش:</span> {order.fabricWeight} {order.fabricWeightUnit}</div>
          <div><span className="font-medium">لون القماش الأساسي:</span> {order.fabricColor}</div>
          <div><span className="font-medium">كمية القماش المطلوبة:</span> {order.fabricQuantity}</div>
        </div>
      </div>

      {/* Sizes and Quantities */}
      <div className="mb-8">
        <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">الكميات المعيارية والمقصوصة فعلياً</h3>
        <table className="w-full text-sm border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-right">المقاس</th>
              <th className="border border-slate-300 p-2 text-right">اللون</th>
              <th className="border border-slate-300 p-2 text-center">المطلوب</th>
              <th className="border border-slate-300 p-2 text-center">الفعلي (يُعبأ بواسطة القص)</th>
            </tr>
          </thead>
          <tbody>
            {order.sizes.map((size) =>
              size.variants.map((v, i) => {
                const actual = order.cutData?.sizes
                  .find(s => s.size === size.size)
                  ?.variants.find(av => av.color === v.color)?.actualQuantity;

                return (
                  <tr key={`${size.size}-${v.color}`}>
                    <td className="border border-slate-300 p-2">{size.size}</td>
                    <td className="border border-slate-300 p-2">{v.color}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{v.quantity}</td>
                    <td className="border border-slate-300 p-2 text-center text-lg">{actual !== undefined ? actual : ''}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Actual Fabric Used By Color */}
      {order.cutData?.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0 && (
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">بيان المسحوب الفعلي من الأقمشة حسب اللون</h3>
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-right">اللون</th>
                <th className="border border-slate-300 p-2 text-center">المسحوب الفعلي ({order.fabricWeightUnit})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(order.cutData.actualWeightByColor).map(([color, weight]) => (
                <tr key={color}>
                  <td className="border border-slate-300 p-2 font-medium">{color}</td>
                  <td className="border border-slate-300 p-2 text-center text-lg">{weight}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 p-2 text-left">إجمالي المسحوب الفعلي:</td>
                <td className="border border-slate-300 p-2 text-center text-lg text-indigo-700">{order.cutData.actualWeight || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-16 grid grid-cols-2 gap-8 text-center">
        <div>
          <p className="font-bold mb-8">مسئول القص</p>
          <div className="border-b-2 border-dashed border-slate-400 w-48 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">الاسم / التوقيع</p>
        </div>
        <div>
          <p className="font-bold mb-8">أمين المخزن</p>
          <div className="border-b-2 border-dashed border-slate-400 w-48 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">الاسم / التوقيع</p>
        </div>
      </div>
    </div>
  );
});

CutWorkOrderPrint.displayName = 'CutWorkOrderPrint';
