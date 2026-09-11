import React from 'react';
import { ProductionOrder, BatchItem } from "../../../types";
import { PrintHeader } from "../layout/PrintHeader";
import { PrintFooter } from "../layout/PrintFooter";

interface Props {
  order: ProductionOrder;
}

export const IroningWorkOrderPrint: React.FC<Props> = ({ order }) => {
  return (
    <div className="print-only print-page print-container" dir="rtl">
      <PrintHeader
        documentTitle="أمر تشغيل المرحلة - المكواة"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        companyName="الشركة"
      />

      <div className="mb-4">
        <h4 className="font-bold text-slate-800 border-b-2 border-slate-800 pb-1 mb-2">تعليمات المكواة</h4>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {order.finishingInstructions || "لا توجد تعليمات خاصة"}
        </p>
      </div>

      <div className="mb-4">
        <h4 className="font-bold text-slate-800 border-b-2 border-slate-800 pb-1 mb-2">تفاصيل أعداد التشطيب الفعلية الموردة</h4>
        <table className="w-full text-sm border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2">الباتش</th>
              <th className="border border-slate-300 p-2">اللون / المقاس</th>
              <th className="border border-slate-300 p-2">كمية الخياطة (مستلم)</th>
              <th className="border border-slate-300 p-2">الكمية المقبولة</th>
              <th className="border border-slate-300 p-2">فرز 2</th>
              <th className="border border-slate-300 p-2">هالك</th>
            </tr>
          </thead>
          <tbody>
            {order.batches?.map(batch => {
              if (!batch.finishingData || !batch.finishingData.actualQuantities) return null;
              return (batch.finishingData.actualQuantities || []).map((sq, idx) => (
                <tr key={`${batch.id}-${idx}`}>
                  {idx === 0 && (
                    <td className="border border-slate-300 p-2 font-bold text-center" rowSpan={batch.finishingData!.actualQuantities?.length || 1}>
                      {batch.batchNumber}
                    </td>
                  )}
                  <td className="border border-slate-300 p-2">{sq.color} - {sq.size}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold">{sq.quantity}</td>
                  <td className="border border-slate-300 p-2"></td>
                  <td className="border border-slate-300 p-2"></td>
                  <td className="border border-slate-300 p-2"></td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <PrintFooter 
        signatures={[
          { role: 'مستلم الخياطة / أمين المخزن' },
          { role: 'مسؤول المكواة' },
          { role: 'مراقب الجودة' }
        ]}
      />
    </div>
  );
};
