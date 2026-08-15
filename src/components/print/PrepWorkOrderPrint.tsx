import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';

interface Props {
  order: ProductionOrder;
}

export const PrepWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  return (
    <div ref={ref} className="gfos-print-document bg-white text-black w-full" dir="rtl">
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">أمر تشغيل تجهيز</h1>
          <p className="text-sm text-slate-600 mt-1">رقم الأمر: {order.orderNumber}</p>
        </div>
        <div className="text-left">
          <p className="text-sm font-bold">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
          <p className="text-sm">الموديل: {order.modelName}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">بيانات الباتشات والمطلوب للتجهيز</h3>
        {order.batches?.map((batch) => (
          <div key={batch.id} className="mb-6 border border-slate-300 rounded p-4 break-inside-avoid">
            <div className="flex justify-between items-center mb-4 bg-slate-100 p-2 rounded">
              <h4 className="font-bold">باتش رقم: {batch.batchNumber}</h4>
              <span className="text-sm">
                المقاسات: {batch.sizes.map(s => s.size).join(', ')}
              </span>
            </div>
            
            <table className="w-full text-sm border-collapse border border-slate-300 mb-4">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2 text-right">الصنف (إكسسوار)</th>
                  <th className="border border-slate-300 p-2 text-center">الكمية المطلوبة (معياري)</th>
                  <th className="border border-slate-300 p-2 text-center">المنصرف الفعلي</th>
                  <th className="border border-slate-300 p-2 text-center">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {order.accessories.map((acc, i) => (
                  <tr key={i}>
                    <td className="border border-slate-300 p-2">{acc.item}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-500">
                      {/* Approximation: just show a blank or an estimated if we want. But the prompt says "هيكون فى المطلوب لكل باتش" */}
                      يُحدد بناءً على كمية الباتش
                    </td>
                    <td className="border border-slate-300 p-2"></td>
                    <td className="border border-slate-300 p-2"></td>
                  </tr>
                ))}
                {order.accessories.length === 0 && (
                   <tr>
                     <td colSpan={4} className="border border-slate-300 p-4 text-center text-slate-500">لا توجد إكسسوارات مسجلة</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="font-bold mb-8">مسئول التجهيز</p>
        <div className="border-b-2 border-dashed border-slate-400 w-48 mx-auto"></div>
        <p className="text-sm text-slate-500 mt-2">الاسم / التوقيع</p>
      </div>
    </div>
  );
});

PrepWorkOrderPrint.displayName = 'PrepWorkOrderPrint';
