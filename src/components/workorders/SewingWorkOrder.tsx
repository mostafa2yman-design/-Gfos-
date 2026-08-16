import React, { forwardRef } from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from '../print/layout';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const SewingWorkOrder = forwardRef<HTMLDivElement, Props>(({ order, batch }, ref) => {
  let requiredTotal = 0;
  batch.sizes.forEach(bs => {
    bs.variants.forEach(v => {
      requiredTotal += v.quantity;
    });
  });

  const sData = batch.sewingData;
  const sewingGroupName = sData?.manufacturingType === 'تصنيع داخلي' 
    ? sData.sewingGroup 
    : sData?.externalManufacturer || 'لم يحدد';

  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="إيصال استلام / تسليم خياطة"
        orderNumber={order.orderNumber}
        modelName={order.modelName}
        clientName={order.customerName}
        additionalInfo={[
          { label: 'رقم الباتش', value: batch.batchNumber },
          { label: 'جهة التنفيذ', value: sewingGroupName },
          { label: 'إجمالي المطلوب', value: `${requiredTotal} قطعة` }
        ]}
      />

      <PrintSection title="تفاصيل المقاسات والألوان">
        <table>
          <thead>
            <tr>
              <th className="text-right">المقاس</th>
              <th className="text-right">اللون</th>
              <th className="text-center">المطلوب (قطعة)</th>
              <th className="text-center">الفعلي المستلم (يُعبأ يدوياً)</th>
              <th className="text-center">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map(size => (
              <React.Fragment key={size.size}>
                {size.variants.map((v, i) => {
                  const actual = sData?.actualQuantities?.find(
                    aq => aq.size === size.size && aq.color === v.color
                  )?.actualQuantity;
                  return (
                    <tr key={`${size.size}-${v.color}`}>
                      {i === 0 && <td className="font-bold align-middle" rowSpan={size.variants.length}>{size.size}</td>}
                      <td>{v.color}</td>
                      <td className="text-center font-bold">{v.quantity}</td>
                      <td className="text-center text-lg">{actual !== undefined && actual > 0 ? actual : ''}</td>
                      <td></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2}>الإجمالي:</td>
              <td className="text-center text-indigo-700">{requiredTotal}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      <PrintSignatures signatures={[{ role: "المُسلِّم (إدارة الإنتاج/المخزن)" }, { role: "المُستلِم (المجموعة/الجهة)" }]} />
    </PrintDocument>
  );
});
SewingWorkOrder.displayName = 'SewingWorkOrder';
