import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, PackingInvoice, PackingInvoiceVariant } from "../types";
import { getOrderById } from "../lib/storage";
import * as Cmd from "../lib/productionOrderCommands";
import { Toast } from "./ui/Toast";
import { Save, Plus, Printer, Trash2 } from "lucide-react";
import { eventBus } from "../lib/events/eventBus";
import { PackingWorkOrderPrint } from "./print/workorders/PackingWorkOrderPrint";

interface Props {
  orderId: string;
  onSaved: () => void;
}

export const PackingForm: React.FC<Props> = ({ orderId, onSaved }) => {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [invoices, setInvoices] = useState<PackingInvoice[]>([]);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: "success" | "error"; } | null>(null);
  
  const [printing, setPrinting] = useState(false);
  
  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const o = await getOrderById(orderId);
    if (o) {
      setOrder(o);
      setInvoices(o.packingInvoices || []);
    }
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const calculateAvailableInventory = () => {
    if (!order) return {};
    
    // Sum from ironing data if available, else fallback to initial order sizes
    const inventory: Record<string, number> = {};
    
    let hasActualData = false;
    order.batches?.forEach(b => {
      if (b.ironingData?.status === 'مكتمل' && b.ironingData.actualQuantities) {
        hasActualData = true;
        b.ironingData.actualQuantities.forEach(q => {
          const key = `${q.size}_${q.color}`;
          inventory[key] = (inventory[key] || 0) + (Number((q as any).actualQuantity ?? (q as any).quantity) || 0);
        });
      }
    });

    if (!hasActualData) {
      order.sizes.forEach(size => {
        size.variants.forEach(v => {
          const key = `${size.size}_${v.color}`;
          inventory[key] = (inventory[key] || 0) + (Number(v.quantity) || 0);
        });
      });
    }
    
    return inventory;
  };

  const calculateRemainingInventory = () => {
    const available = calculateAvailableInventory();
    const remaining = { ...available };
    
    invoices.forEach(inv => {
      inv.variants.forEach(v => {
        const key = `${v.size}_${v.color}`;
        if (remaining[key] !== undefined) {
          remaining[key] -= (Number(v.quantity) || 0);
        }
      });
    });
    
    return remaining;
  };

  const availableInventory = calculateAvailableInventory();
  const remainingInventory = calculateRemainingInventory();

  // Get unique colors and sizes based on order sizes
  const uniqueSizes = order?.sizes.map(s => s.size) || [];
  const uniqueColors = Array.from(new Set(order?.sizes.flatMap(s => s.variants.map(v => v.color)) || []));

  const handleAddInvoice = () => {
    const newInvoice: PackingInvoice = {
      id: `inv-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customerName: order?.customerName || "",
      variants: []
    };
    setInvoices([...invoices, newInvoice]);
  };

  const handleRemoveInvoice = (id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  };

  const handleInvoiceChange = (invId: string, field: string, value: string) => {
    setInvoices(invoices.map(inv => inv.id === invId ? { ...inv, [field]: value } : inv));
  };

  const handleVariantChange = (invId: string, size: string, color: string, quantity: number) => {
    setInvoices(invoices.map(inv => {
      if (inv.id !== invId) return inv;
      
      const newVariants = [...inv.variants];
      const idx = newVariants.findIndex(v => v.size === size && v.color === color);
      if (idx >= 0) {
        newVariants[idx].quantity = quantity;
      } else {
        newVariants.push({ size, color, quantity });
      }
      return { ...inv, variants: newVariants };
    }));
  };

  const handleSave = async () => {
    if (!order) return;
    try {
      const updatedOrder = { ...order, packingInvoices: invoices };
      await Cmd.saveDraft(updatedOrder);
      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ORDER_UPDATED' as any,
        aggregateType: 'ProductionOrder',
        aggregateId: updatedOrder.id,
        occurredAt: new Date().toISOString(),
        payload: { order: updatedOrder }
      });
      setToastConfig({ message: "تم حفظ بيانات التغليف بنجاح", type: "success" });
      onSaved();
    } catch (error) {
      setToastConfig({ message: "حدث خطأ أثناء الحفظ", type: "error" });
    }
  };

  if (!order) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">تجهيز التغليف والفواتير</h2>
          <p className="text-sm text-slate-500">أمر رقم: {order.orderNumber}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handlePrintAll}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة أمر التغليف</span>
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ</span>
          </button>
        </div>
      </div>

      {/* Remaining Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">بيانات القصة الأساسية والمتبقي للتغليف</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b">اللون / المقاس</th>
                {uniqueSizes.map((size) => (
                  <th key={size} className="px-4 py-3 font-semibold text-slate-700 border-b text-center">
                    {size}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-slate-700 border-b text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {uniqueColors.map((color) => {
                let colorTotal = 0;
                return (
                  <tr key={color} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{color}</td>
                    {uniqueSizes.map((size) => {
                      const key = `${size}_${color}`;
                      const remain = remainingInventory[key] || 0;
                      const initial = availableInventory[key] || 0;
                      colorTotal += remain;
                      
                      return (
                        <td key={size} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-bold ${remain > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {remain}
                            </span>
                            <span className="text-[10px] text-slate-400 border-t border-slate-200 mt-1 pt-1 w-8 text-center">
                              {initial}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-slate-800 bg-slate-50">
                      {colorTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-slate-500 flex gap-4">
             <div><span className="font-bold text-indigo-600">الرقم العلوي:</span> المتبقي للتغليف</div>
             <div><span className="text-slate-400">الرقم السفلي:</span> إجمالي القص/الإنتاج</div>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">فواتير التجهيز</h3>
          <button
            onClick={handleAddInvoice}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تجهيز فاتورة</span>
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 border-dashed text-center">
            <p className="text-slate-500">لا توجد فواتير تجهيز. اضغط على إضافة تجهيز فاتورة للبدء.</p>
          </div>
        ) : (
          invoices.map((inv, idx) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-indigo-900">فاتورة #{idx + 1}</h4>
                <button
                  onClick={() => handleRemoveInvoice(inv.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  title="حذف الفاتورة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الفاتورة</label>
                    <input
                      type="date"
                      value={inv.date}
                      onChange={(e) => handleInvoiceChange(inv.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل</label>
                    <input
                      type="text"
                      value={inv.customerName}
                      onChange={(e) => handleInvoiceChange(inv.id, 'customerName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-slate-700 border-b">اللون / المقاس</th>
                        {uniqueSizes.map((size) => (
                          <th key={size} className="px-4 py-2 font-semibold text-slate-700 border-b text-center">
                            {size}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueColors.map((color) => (
                        <tr key={color} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-medium text-slate-800">{color}</td>
                          {uniqueSizes.map((size) => {
                            const variant = inv.variants.find(v => v.size === size && v.color === color);
                            const val = variant?.quantity || '';
                            const key = `${size}_${color}`;
                            
                            // To show validation: warn if input is greater than available + what was in this input before
                            const currentRemain = remainingInventory[key] || 0;
                            const maxAllowed = currentRemain + (Number(val) || 0);

                            return (
                              <td key={size} className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxAllowed}
                                  value={val}
                                  onChange={(e: any) => handleVariantChange(inv.id, size as string, color as string, parseInt(e.target.value as string) || 0)}
                                  className={`w-16 px-2 py-1 text-center border rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                    (Number(val) || 0) > maxAllowed ? 'border-red-500 text-red-600 bg-red-50' : 'border-slate-300'
                                  }`}
                                  title={`المتاح: ${maxAllowed}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}

      {printing && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto print:block">
          <div >
            <PackingWorkOrderPrint order={order} invoices={invoices} />
          </div>
        </div>
      )}
    </div>
  );
};
