import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from './layout';

interface Props {
  order: ProductionOrder;
}

export const CutWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
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
            {order.sizes.map((size) =>
              size.variants.map((v) => {
                const actual = order.cutData?.sizes
                  .find(s => s.size === size.size)
                  ?.variants.find(av => av.color === v.color)?.actualQuantity;
                return (
                  <tr key={`${size.size}-${v.color}`}>
                    <td>{size.size}</td>
                    <td>{v.color}</td>
                    <td className="text-center font-bold">{v.quantity}</td>
                    <td className="text-center">{actual !== undefined ? actual : ''}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </PrintSection>

      {order.cutData?.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0 && (
        <PrintSection title="بيان المسحوب الفعلي من الأقمشة حسب اللون" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>اللون</th>
                <th className="text-center">المسحوب الفعلي ({order.fabricWeightUnit})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(order.cutData.actualWeightByColor).map(([color, weight]) => (
                <tr key={color}>
                  <td className="font-medium">{color}</td>
                  <td className="text-center">{weight}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td>إجمالي المسحوب الفعلي:</td>
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
