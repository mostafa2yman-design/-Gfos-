import React from 'react';
import { ProductionOrder, BatchItem } from '../../types';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const PrintEmbroideryWorkOrder: React.FC<Props> = ({ order, batch }) => {
  let totalQuantity = 0;
  batch.sizes.forEach(s => s.variants.forEach(v => totalQuantity += v.quantity));

  return (
    <div className="gfos-print-document print-only hidden print:block text-black bg-white" dir="rtl">
      

      <div className="header-title">
        <h1>GFOS</h1>
        <h2>أمر تشغيل — الطباعة / التطريز</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div className="flex flex-col gap-2">
          <p><strong>رقم أمر الإنتاج:</strong> {order.orderNumber}</p>
          <p><strong>اسم القصة:</strong> {order.styleName}</p>
          <p><strong>العميل:</strong> {order.customerName}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p><strong>تاريخ أمر الإنتاج:</strong> {new Date(order.orderDate).toLocaleDateString('ar-EG')}</p>
          <p><strong>النوع:</strong> {order.category}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold bg-slate-100 p-2 mb-2 print:bg-slate-100">
          الباتش: {batch.batchNumber} - التنفيذ: {batch.executionType || 'بدون طباعة / تطريز'}
        </h3>

        {(batch.executionType === 'طباعة' || batch.executionType === 'طباعة + تطريز') && batch.printDetails && (
          <div className="mb-4 p-3 border rounded">
            <h4 className="font-bold underline mb-2">بيانات الطباعة:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>التصميم:</strong> {batch.printDetails.designName}</div>
              <div><strong>المكان:</strong> {batch.printDetails.placement}</div>
              <div><strong>الألوان:</strong> {batch.printDetails.colors} ({batch.printDetails.colorCount} لون)</div>
            </div>
          </div>
        )}

        {(batch.executionType === 'تطريز' || batch.executionType === 'طباعة + تطريز') && batch.embroideryDetails && (
          <div className="mb-4 p-3 border rounded">
            <h4 className="font-bold underline mb-2">بيانات التطريز:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>التصميم:</strong> {batch.embroideryDetails.designName}</div>
              <div><strong>المكان:</strong> {batch.embroideryDetails.placement}</div>
              <div><strong>ألوان الخيوط:</strong> {batch.embroideryDetails.threadColors} ({batch.embroideryDetails.colorCount} لون)</div>
            </div>
          </div>
        )}

        <table className="mb-4">
          <thead>
            <tr>
              <th className="w-1/4">المقاس</th>
              <th className="w-1/4">اللون</th>
              <th className="w-1/4">الكمية</th>
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
                    <td>{v.color}</td>
                    <td>{v.quantity}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr>
              <td colSpan={2} className="font-bold text-left">إجمالي الباتش:</td>
              <td className="font-bold">{totalQuantity}</td>
            </tr>
          </tbody>
        </table>

        <div className="border p-4 mb-4">
          <h4 className="font-bold mb-2">تعليمات التشغيل:</h4>
          {batch.printDetails?.notes && <p className="mb-1"><strong>ملاحظات الطباعة:</strong> {batch.printDetails.notes}</p>}
          {batch.embroideryDetails?.notes && <p className="mb-1"><strong>ملاحظات التطريز:</strong> {batch.embroideryDetails.notes}</p>}
          {!batch.printDetails?.notes && !batch.embroideryDetails?.notes && <p className="text-gray-500">لا توجد ملاحظات</p>}
        </div>
      </div>

      <div className="mt-12 flex justify-between px-10 text-center">
        <div>
          <h4 className="font-bold mb-8">إعداد</h4>
          <p>الاسم: ________________</p>
          <p className="mt-4">التوقيع: ________________</p>        
        </div>
        <div>
          <h4 className="font-bold mb-8">تنفيذ</h4>
          <p>الاسم: ________________</p>
          <p className="mt-4">التوقيع: ________________</p>
        </div>
        <div>
          <h4 className="font-bold mb-8">اعتماد</h4>
          <p>الاسم: ________________</p>
          <p className="mt-4">التوقيع: ________________</p>
        </div>
      </div>
    </div>
  );
};
