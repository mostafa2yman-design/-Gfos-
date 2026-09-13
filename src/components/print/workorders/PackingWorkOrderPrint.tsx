import React from 'react';
import { ProductionOrder, PackingInvoice } from '../../../types';
import { PrintHeader } from '../layout/PrintHeader';
import { PrintSignatures } from '../layout/PrintSignatures';

interface Props {
  order: ProductionOrder;
  invoices: PackingInvoice[];
}

export const PackingWorkOrderPrint: React.FC<Props> = ({ order, invoices }) => {
  const uniqueSizes = order.sizes.map(s => s.size) || [];
  const uniqueColors = Array.from(new Set(order.sizes.flatMap(s => s.variants.map(v => v.color)) || []));

  return (
    <div className="print-page">
      <div className="p-8 bg-white min-h-screen font-sans" dir="rtl">
        <PrintHeader title="أمر تغليف وتجهيز" />

        <div className="grid grid-cols-2 gap-6 mb-8 mt-6">
          <div className="border border-slate-800 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b border-slate-800 pb-2">بيانات الأمر الأساسية</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">رقم الأمر</p>
                <p className="font-bold text-lg">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">تاريخ الأمر</p>
                <p className="font-bold">{order.orderDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">اسم الموديل</p>
                <p className="font-bold">{order.styleName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">العميل</p>
                <p className="font-bold">{order.customerName}</p>
              </div>
            </div>
          </div>
          <div className="border border-slate-800 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2 border-b border-slate-800 pb-2">تعليمات التغليف</h3>
            <p className="whitespace-pre-wrap">{order.packingInstructions || 'لا توجد تعليمات خاصة بالتغليف.'}</p>
          </div>
        </div>

        <h3 className="font-bold text-xl mb-4 border-b-2 border-slate-800 pb-2">تفاصيل الفواتير المطلوب تجهيزها</h3>
        
        {invoices.length === 0 ? (
          <p className="text-center py-8 text-slate-500">لا توجد فواتير تجهيز مسجلة.</p>
        ) : (
          invoices.map((inv, idx) => {
            // Check if this invoice has any quantities > 0
            const hasQuantities = inv.variants.some(v => v.quantity > 0);
            if (!hasQuantities) return null;

            return (
              <div key={inv.id} className="mb-8 border-2 border-slate-800 rounded-xl overflow-hidden break-inside-avoid">
                <div className="bg-slate-100 p-4 border-b-2 border-slate-800 flex justify-between items-center">
                  <h4 className="font-bold text-lg">فاتورة تجهيز #{idx + 1}</h4>
                  <div className="flex gap-6">
                    <div>
                      <span className="text-sm text-slate-600 ml-2">تاريخ الفاتورة:</span>
                      <span className="font-bold">{inv.date}</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600 ml-2">العميل:</span>
                      <span className="font-bold">{inv.customerName}</span>
                    </div>
                  </div>
                </div>
                
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-800 p-2 font-bold w-32">اللون / المقاس</th>
                      {uniqueSizes.map(size => (
                        <th key={size} className="border border-slate-800 p-2 font-bold">{size}</th>
                      ))}
                      <th className="border border-slate-800 p-2 font-bold bg-slate-100 w-24">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueColors.map(color => {
                      let colorTotal = 0;
                      let hasColorQuantities = false;
                      
                      const cells = uniqueSizes.map(size => {
                        const variant = inv.variants.find(v => v.size === size && v.color === color);
                        const qty = variant?.quantity || 0;
                        colorTotal += qty;
                        if (qty > 0) hasColorQuantities = true;
                        
                        return (
                          <td key={size} className="border border-slate-800 p-2 font-semibold">
                            {qty > 0 ? qty : '-'}
                          </td>
                        );
                      });

                      if (!hasColorQuantities) return null;

                      return (
                        <tr key={color}>
                          <td className="border border-slate-800 p-2 font-bold bg-slate-50">{color}</td>
                          {cells}
                          <td className="border border-slate-800 p-2 font-bold bg-slate-100">{colorTotal}</td>
                        </tr>
                      );
                    })}
                    {/* Add totals row */}
                    <tr className="bg-slate-100">
                      <td className="border border-slate-800 p-2 font-bold">إجمالي المقاس</td>
                      {uniqueSizes.map(size => {
                        const sizeTotal = inv.variants
                          .filter(v => v.size === size)
                          .reduce((sum, v) => sum + (v.quantity || 0), 0);
                        return (
                          <td key={size} className="border border-slate-800 p-2 font-bold">
                            {sizeTotal > 0 ? sizeTotal : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-slate-800 p-2 font-bold text-lg">
                        {inv.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        <div className="mt-12">
          <PrintSignatures signatures={[{ role: "مسئول التغليف" }, { role: "المستلم" }]} />
        </div>
      </div>
    </div>
  );
};
