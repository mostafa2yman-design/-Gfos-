import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from './layout';

interface Props {
  order: ProductionOrder;
  fabricSummary?: any;
}

export const CutWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order, fabricSummary }, ref) => {
  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل قص"
        orderNumber={order.orderNumber}
        modelName={order.modelName}
        clientName={order.clientName}
        additionalInfo={[
          { label: 'نوع القماش', value: order.fabricType },
          { label: 'لون القماش', value: order.fabricColor },
          { label: 'كمية القماش', value: order.fabricQuantity.toString() }
        ]}
      />

      <PrintSection title="الكميات المعيارية والمقصوصة فعلياً">
        <table>
          <thead>
            <tr>
              <th>المقاس</th>
              <th>اللون</th>
              <th className="text-center">المطلوب</th>
              <th className="text-center">الفعلي (يُعبأ بواسطة القص)</th>
            </tr>
          </thead>
          <tbody>
            {order.sizes.map((size) => (
              <React.Fragment key={size.size}>
                {size.variants.map((v, i) => {
                  const actual = order.cutData?.sizes
                    .find(s => s.size === size.size)
                    ?.variants.find(av => av.color === v.color)?.actualQuantity;
                  return (
                    <tr key={`${size.size}-${v.color}`}>
                      {i === 0 && <td className="font-bold align-middle" rowSpan={size.variants.length}>{size.size}</td>}
                      <td>{v.color}</td>
                      <td className="text-center font-bold">{v.quantity}</td>
                      <td className="text-center text-lg">{actual !== undefined ? actual : ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </PrintSection>

      {fabricSummary && fabricSummary.colors.length > 0 && (
        <PrintSection title="بيان مسحوبات الأقمشة من المخزن حسب اللون" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>اللون</th>
                <th className="text-center">المطلوب المعياري ({order.fabricWeightUnit})</th>
                <th className="text-center">المسحوب الفعلي ({order.fabricWeightUnit})</th>
              </tr>
            </thead>
            <tbody>
              {(fabricSummary?.colors || []).map((c: any) => {
                const weight = order.cutData?.actualWeightByColor?.[c.color];
                return (
                  <tr key={c.color}>
                    <td className="font-medium">{c.color}</td>
                    <td className="text-center">{c.requiredFabric ? c.requiredFabric.toFixed(3) : '—'}</td>
                    <td className="text-center text-lg">{weight !== undefined ? weight : ''}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-bold">
                <td>الإجمالي:</td>
                <td className="text-center text-indigo-700">{fabricSummary?.totalRequiredFabric ? fabricSummary.totalRequiredFabric.toFixed(3) : '—'}</td>
                <td className="text-center text-indigo-700">{order.cutData.actualWeight || 0}</td>
              </tr>
            </tbody>
          </table>
        </PrintSection>
      )}

      <PrintSignatures signatures={[{ role: "أمين المخزن" }, { role: "مسئول القص" }]} />
    </PrintDocument>
  );
});
CutWorkOrderPrint.displayName = 'CutWorkOrderPrint';
