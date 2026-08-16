import React from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from '../print/layout';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const PrintEmbroideryWorkOrder: React.FC<Props> = ({ order, batch }) => {
  let totalQuantity = 0;
  batch.sizes.forEach(s => s.variants.forEach(v => totalQuantity += v.quantity));
  
  return (
    <PrintDocument>
      <PrintHeader
        documentTitle="أمر تشغيل — الطباعة / التطريز"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        additionalInfo={[
          { label: 'رقم الباتش', value: batch.batchNumber },
          { label: 'النوع', value: order.category },
          { label: 'التنفيذ', value: batch.executionType || 'بدون طباعة / تطريز' }
        ]}
      />

      <div className="mb-4">
        {(batch.executionType === 'طباعة' || batch.executionType === 'طباعة + تطريز') && batch.printDetails && (
          <div className="mb-3 p-2 border border-slate-300 bg-slate-50 rounded text-[10px] break-inside-avoid">
            <h4 className="font-bold underline mb-1">بيانات الطباعة:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div><span className="font-bold">التصميم:</span> {batch.printDetails.designName}</div>
              <div><span className="font-bold">المكان:</span> {batch.printDetails.placement}</div>
              <div><span className="font-bold">الألوان:</span> {batch.printDetails.colors} ({batch.printDetails.colorCount} لون)</div>
            </div>
          </div>
        )}
        
        {(batch.executionType === 'تطريز' || batch.executionType === 'طباعة + تطريز') && batch.embroideryDetails && (
          <div className="mb-3 p-2 border border-slate-300 bg-slate-50 rounded text-[10px] break-inside-avoid">
            <h4 className="font-bold underline mb-1">بيانات التطريز:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div><span className="font-bold">التصميم:</span> {batch.embroideryDetails.designName}</div>
              <div><span className="font-bold">المكان:</span> {batch.embroideryDetails.placement}</div>
              <div><span className="font-bold">ألوان الخيوط:</span> {batch.embroideryDetails.threadColors} ({batch.embroideryDetails.colorCount} لون)</div>
            </div>
          </div>
        )}
      </div>

      <PrintSection title="تفاصيل المقاسات والألوان">
        <table>
          <thead>
            <tr>
              <th className="w-1/4">المقاس</th>
              <th className="w-1/4">اللون</th>
              <th className="w-1/4 text-center">الكمية</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map(size => (
              <React.Fragment key={size.size}>
                {size.variants.map((v, vIdx) => (
                  <tr key={`${size.size}-${v.color}`}>
                    {vIdx === 0 && (
                      <td rowSpan={size.variants.length} className="font-bold text-center align-middle">
                        {size.size}
                      </td>
                    )}
                    <td className="text-center">{v.color}</td>
                    <td className="text-center font-bold">{v.quantity}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-slate-50">
              <td colSpan={2} className="font-bold">إجمالي الباتش:</td>
              <td className="font-bold text-center">{totalQuantity}</td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      <PrintSection title="تعليمات التشغيل" avoidBreak>
        <div className="border border-slate-300 rounded p-2 bg-slate-50 min-h-[40px]">
          {batch.printDetails?.notes && <p className="mb-1"><span className="font-bold">ملاحظات الطباعة:</span> {batch.printDetails.notes}</p>}
          {batch.embroideryDetails?.notes && <p className="mb-1"><span className="font-bold">ملاحظات التطريز:</span> {batch.embroideryDetails.notes}</p>}
          {!batch.printDetails?.notes && !batch.embroideryDetails?.notes && <p className="text-slate-500 text-center">لا توجد ملاحظات</p>}
        </div>
      </PrintSection>

      <PrintSignatures signatures={[{ role: "إعداد" }, { role: "تنفيذ" }, { role: "اعتماد" }]} />
    </PrintDocument>
  );
};
