import React, { forwardRef } from 'react';
import { ProductionOrder, BatchItem } from '../../types';

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
    <div ref={ref} className="p-8 bg-white text-black w-full" dir="rtl" style={{ minHeight: '297mm' }}>
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">إيصال استلام / تسليم خياطة</h1>
          <p className="text-sm text-slate-600 mt-1">رقم الأمر: {order.orderNumber}</p>
        </div>
        <div className="text-left">
          <p className="text-sm font-bold">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
          <p className="text-sm">الموديل: {order.modelName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div className="flex flex-col gap-2">
          <p><span className="font-bold text-slate-600 w-32 inline-block">باتش رقم:</span> <span className="font-bold text-lg">{batch.batchNumber}</span></p>
          <p><span className="font-bold text-slate-600 w-32 inline-block">العميل:</span> <span>{order.customerName}</span></p>
        </div>
        <div className="flex flex-col gap-2">
          <p><span className="font-bold text-slate-600 w-32 inline-block">جهة التنفيذ:</span> <span className="font-bold">{sewingGroupName}</span></p>
          <p><span className="font-bold text-slate-600 w-32 inline-block">إجمالي المطلوب:</span> <span className="font-bold">{requiredTotal} قطعة</span></p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">تفاصيل المقاسات والألوان</h3>
        <table className="w-full text-sm border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-right">المقاس</th>
              <th className="border border-slate-300 p-2 text-right">اللون</th>
              <th className="border border-slate-300 p-2 text-center">المطلوب (قطعة)</th>
              <th className="border border-slate-300 p-2 text-center">الفعلي المستلم (يُعبأ يدوياً)</th>
              <th className="border border-slate-300 p-2 text-center">ملاحظات</th>
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
                      {i === 0 && <td className="border border-slate-300 p-2 font-bold" rowSpan={size.variants.length}>{size.size}</td>}
                      <td className="border border-slate-300 p-2">{v.color}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{v.quantity}</td>
                      <td className="border border-slate-300 p-2 text-center text-lg">{actual !== undefined && actual > 0 ? actual : ''}</td>
                      <td className="border border-slate-300 p-2"></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2} className="border border-slate-300 p-2 text-left">الإجمالي:</td>
              <td className="border border-slate-300 p-2 text-indigo-700 text-center">{requiredTotal}</td>
              <td colSpan={2} className="border border-slate-300 p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid">
        <div>
          <p className="font-bold mb-8">المُسلِّم (إدارة الإنتاج/المخزن)</p>
          <div className="border-b-2 border-dashed border-slate-400 w-48 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">الاسم / التوقيع</p>
        </div>
        <div>
          <p className="font-bold mb-8">المُستلِم (المجموعة/الجهة)</p>
          <div className="border-b-2 border-dashed border-slate-400 w-48 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">الاسم / التوقيع</p>
        </div>
      </div>
    </div>
  );
});

SewingWorkOrder.displayName = 'SewingWorkOrder';
