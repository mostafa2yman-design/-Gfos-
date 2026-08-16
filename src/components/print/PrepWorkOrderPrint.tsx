import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from './layout';

interface Props {
  order: ProductionOrder;
}

export const PrepWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل تجهيز شامل"
        orderNumber={order.orderNumber}
        modelName={order.modelName}
        clientName={order.clientName}
      />

      <PrintSection title="بيانات الباتشات والمطلوب للتجهيز">
        {order.batches?.map((batch) => (
          <div key={batch.id} className="mb-6 break-inside-avoid">
            <div className="flex justify-between items-center mb-2 bg-slate-100 p-1 px-2 rounded border border-slate-200 text-[11px]">
              <span className="font-bold">باتش رقم: {batch.batchNumber}</span>
              <span>المقاسات: {batch.sizes.map(s => s.size).join(', ')}</span>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>الصنف (إكسسوار)</th>
                  <th className="text-center">الكمية المطلوبة (معياري)</th>
                  <th className="text-center">المنصرف الفعلي</th>
                  <th className="text-center">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {order.accessories.map((acc, i) => (
                  <tr key={i}>
                    <td>{acc.item}</td>
                    <td className="text-center text-slate-500">يُحدد بناءً على كمية الباتش</td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
                {order.accessories.length === 0 && (
                   <tr>
                     <td colSpan={4} className="text-center text-slate-500">لا توجد إكسسوارات مسجلة</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </PrintSection>

      <PrintSignatures signatures={[{ role: "مسئول التجهيز" }]} />
    </PrintDocument>
  );
});
PrepWorkOrderPrint.displayName = 'PrepWorkOrderPrint';
