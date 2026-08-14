import React from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { calculateBatchAccessories } from '../../lib/prepUtils';
import { CheckSquare, Square } from 'lucide-react';

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
    <div className="block p-8 bg-white" dir="rtl">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">GFOS</h1>
        <h2 className="text-xl font-bold text-slate-600">أمر تجهيز باتش</h2>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div className="flex flex-col gap-2">
          <p><span className="font-bold text-slate-600 w-32 inline-block">رقم أمر الإنتاج:</span> <span className="font-bold">{order.orderNumber}</span></p>
          <p><span className="font-bold text-slate-600 w-32 inline-block">رقم الباتش:</span> <span className="font-bold text-lg">{batch.batchNumber}</span></p>
          <p><span className="font-bold text-slate-600 w-32 inline-block">تاريخ التجهيز:</span> <span>{new Date().toLocaleDateString('ar-EG')}</span></p>
        </div>
        <div className="flex flex-col gap-2">
          <p><span className="font-bold text-slate-600 w-32 inline-block">اسم القصة:</span> <span className="font-bold">{order.styleName}</span></p>
          <p><span className="font-bold text-slate-600 w-32 inline-block">العميل:</span> <span>{order.customerName}</span></p>
          <p><span className="font-bold text-slate-600 w-32 inline-block">إجمالي كمية الباتش:</span> <span className="font-bold">{totalBatchQty} قطعة</span></p>
        </div>
      </div>

      {/* Batch Contents */}
      <div className="mb-8">
        <h3 className="font-bold text-lg text-slate-800 mb-3">تفاصيل كمية الباتش</h3>
        <table className="w-full text-right border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 font-bold">المقاس</th>
              <th className="border border-slate-300 p-2 font-bold">اللون</th>
              <th className="border border-slate-300 p-2 font-bold">الكمية</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map((s) => (
              <React.Fragment key={s.size}>
                {s.variants.map((v, i) => (
                  <tr key={`${s.size}-${v.color}`}>
                    {i === 0 && (
                      <td className="border border-slate-300 p-2 font-bold" rowSpan={s.variants.length}>{s.size}</td>
                    )}
                    <td className="border border-slate-300 p-2">{v.color}</td>
                    <td className="border border-slate-300 p-2 font-bold">{v.quantity}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2} className="border border-slate-300 p-2 text-left">إجمالي الباتش:</td>
              <td className="border border-slate-300 p-2 text-indigo-700">{totalBatchQty}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Accessories */}
      <div className="mb-8">
        <h3 className="font-bold text-lg text-slate-800 mb-3">الإكسسوارات المطلوبة</h3>
        {accessories.length > 0 ? (
          <table className="w-full text-right border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 font-bold">الإكسسوار</th>
                <th className="border border-slate-300 p-2 font-bold text-center">الوحدة</th>
                <th className="border border-slate-300 p-2 font-bold text-center">المطلوب للقطعة</th>
                <th className="border border-slate-300 p-2 font-bold text-center">المطلوب للباتش</th>
                <th className="border border-slate-300 p-2 font-bold text-center w-32">حالة التجهيز</th>
              </tr>
            </thead>
            <tbody>
              {accessories.map(acc => {
                // Round required to 3 decimal places if needed, otherwise no decimals
                const roundedRequired = acc.requiredForBatch % 1 === 0 
                  ? acc.requiredForBatch 
                  : Number(acc.requiredForBatch.toFixed(3));
                  
                return (
                  <tr key={acc.accessoryId || acc.accessoryName}>
                    <td className="border border-slate-300 p-2 font-medium">{acc.accessoryName}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{acc.unit}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{acc.standardPerPiece}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-indigo-700">{roundedRequired}</td>
                    <td className="border border-slate-300 p-2 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {acc.isPrepared ? <CheckSquare className="w-5 h-5 text-slate-800" /> : <Square className="w-5 h-5 text-slate-400" />}
                        <span className="text-xs">{acc.isPrepared ? 'تم التجهيز' : 'غير مجهز'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 italic">لا توجد إكسسوارات مطلوبة لهذا الأمر.</p>
        )}
      </div>

      {/* Notes */}
      <div className="mb-12 break-inside-avoid">
        <h3 className="font-bold text-lg text-slate-800 mb-3">ملاحظات التجهيز</h3>
        <div className="border-2 border-slate-200 rounded-lg h-32 p-4"></div>
      </div>

      {/* Approvals */}
      <div className="grid grid-cols-4 gap-4 mt-16 pt-8 border-t border-slate-300 break-inside-avoid text-sm">
        <div className="text-center">
          <p className="font-bold mb-8">إعداد:</p>
          <p className="border-b border-slate-400 mx-4"></p>
        </div>
        <div className="text-center">
          <p className="font-bold mb-8">تجهيز:</p>
          <p className="border-b border-slate-400 mx-4"></p>
        </div>
        <div className="text-center">
          <p className="font-bold mb-8">مراجعة:</p>
          <p className="border-b border-slate-400 mx-4"></p>
        </div>
        <div className="text-center">
          <p className="font-bold mb-8">اعتماد:</p>
          <p className="border-b border-slate-400 mx-4"></p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 text-xs text-slate-500 flex justify-between border-t border-slate-200">
        <span>رقم الباتش: {batch.batchNumber}</span>
        <span>تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</span>
        <span>رقم أمر الإنتاج: {order.orderNumber}</span>
      </div>
      
      {/* Ensure printing properties */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 20mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
};
