import React from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { calculateBatchAccessories } from '../../lib/prepUtils';
import { CheckSquare, Square } from 'lucide-react';
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from '../print/layout';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const BatchPreparationWorkOrder: React.FC<Props> = ({ order, batch }) => {
  const accessories = calculateBatchAccessories(order, batch);
  
  let totalBatchQty = 0;
  batch.sizes.forEach(s => {
    s.variants.forEach(v => {
      totalBatchQty += v.quantity;
    });
  });

  return (
    <PrintDocument>
      <PrintHeader
        documentTitle="أمر تجهيز باتش"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        additionalInfo={[
          { label: 'رقم الباتش', value: batch.batchNumber },
          { label: 'إجمالي الكمية', value: `${totalBatchQty} قطعة` }
        ]}
      />

      <PrintSection title="تفاصيل كمية الباتش">
        <table>
          <thead>
            <tr>
              <th>المقاس</th>
              <th>اللون</th>
              <th className="text-center">الكمية</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map((s) => (
              <React.Fragment key={s.size}>
                {s.variants.map((v, i) => (
                  <tr key={`${s.size}-${v.color}`}>
                    {i === 0 && (
                      <td className="font-bold text-center align-middle" rowSpan={s.variants.length}>{s.size}</td>
                    )}
                    <td className="text-center">{v.color}</td>
                    <td className="font-bold text-center">{v.quantity}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2}>إجمالي الباتش:</td>
              <td className="text-center text-indigo-700">{totalBatchQty}</td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      <PrintSection title="الإكسسوارات المطلوبة">
        {accessories.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>الإكسسوار</th>
                <th className="text-center">الوحدة</th>
                <th className="text-center">المطلوب للقطعة</th>
                <th className="text-center">المطلوب للباتش</th>
                <th className="text-center">حالة التجهيز</th>
              </tr>
            </thead>
            <tbody>
              {accessories.map(acc => {
                const roundedRequired = acc.requiredForBatch % 1 === 0 
                  ? acc.requiredForBatch 
                  : Number(Number(acc.requiredForBatch).toFixed(3));
                
                return (
                  <tr key={acc.accessoryId || acc.accessoryName}>
                    <td className="font-medium">{acc.accessoryName}</td>
                    <td className="text-center text-slate-600">{acc.unit}</td>
                    <td className="text-center text-slate-600">{acc.standardPerPiece}</td>
                    <td className="text-center font-bold text-indigo-700">{roundedRequired}</td>
                    <td className="text-center">
                      <div className="flex justify-center items-center gap-1">
                        {acc.isPrepared ? <CheckSquare className="w-3 h-3 text-slate-800" /> : <Square className="w-3 h-3 text-slate-400" />}
                        <span className="text-[9px]">{acc.isPrepared ? 'تم التجهيز' : 'غير مجهز'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 italic text-[10px]">لا توجد إكسسوارات مطلوبة لهذا الأمر.</p>
        )}
      </PrintSection>

      <PrintSection title="ملاحظات التجهيز" avoidBreak>
        <div className="border border-slate-300 rounded-lg h-24 p-2 bg-slate-50"></div>
      </PrintSection>

      <PrintSignatures signatures={[{ role: "إعداد" }, { role: "تجهيز" }, { role: "مراجعة" }, { role: "اعتماد" }]} />
    </PrintDocument>
  );
};
