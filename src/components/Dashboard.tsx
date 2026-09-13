import React, { useEffect, useState } from "react";
import { getOrders, getFactorySettings } from "../lib/storage";
import { ProductionOrder, FactorySettings } from "../types";
import {
  FileText,
  ClipboardList,
  Archive,
  ArrowLeft,
  Calculator,
  CircleDollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { calculateGlobalCostMetrics, calculateOrderCostAnalysis } from "../lib/costUtils";

interface DashboardProps {
  onNavigate: (view: "dashboard" | "list" | "form" | "settings") => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

export function Dashboard({ onNavigate, onNavigateToOrder }: DashboardProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [factory, setFactory] = useState<FactorySettings | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showOrdersTable, setShowOrdersTable] = useState(false);

  useEffect(() => {
    getOrders().then(data => setOrders(data));
    setFactory(getFactorySettings());
  }, []);

  const costMetrics = calculateGlobalCostMetrics(orders);
  
  const inProgressOrders = orders.filter((o) => o.status !== "مسودة" && o.status !== "مغلق");

  const stats = [
    {
      title: "إجمالي الأوامر",
      value: orders.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      onClick: () => { setShowOrdersTable(!showOrdersTable); setShowMap(false); },
      clickable: true,
      active: showOrdersTable
    },
    {
      title: "مسودات",
      value: orders.filter((o) => o.status === "مسودة").length,
      icon: ClipboardList,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    {
      title: "قيد التشغيل",
      value: inProgressOrders.length,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      onClick: () => { setShowMap(!showMap); setShowOrdersTable(false); },
      clickable: true,
      active: showMap
    },
    {
      title: "مغلقة",
      value: orders.filter((o) => o.status === "مغلق").length,
      icon: Archive,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
    },
  ];

  interface StageItem {
    id: string;
    orderNumber: string;
    orderId: string;
    batchNumber?: string;
    quantity: number;
    details?: string;
    isOrderOnly?: boolean;
    tab?: string;
  }

  const getKanbanData = () => {
    const cutting: StageItem[] = [];
    const preparation: StageItem[] = [];
    const printEmb: StageItem[] = [];
    const sewing: StageItem[] = [];
    const finishing: StageItem[] = [];
    const ironing: StageItem[] = [];
    const packing: StageItem[] = [];

    inProgressOrders.forEach((order) => {
      const hasLockedBatches =
        order.batches &&
        order.batches.length > 0 &&
        !["أمر إنتاج معتمد", "أمر قص", "القص الفعلي مدخل", "القص معتمد", "تقسيم الباتشات"].includes(order.status);

      if (!hasLockedBatches) {
        const totalQty = (order.sizes || []).reduce(
          (sum, size) => sum + size.variants.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0),
          0
        );
        cutting.push({
          id: `order-${order.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          quantity: totalQty,
          details: order.status,
          isOrderOnly: true,
        });
        return;
      }

      order.batches?.forEach((batch) => {
        const initialQty = batch.sizes.reduce((sum, size) => sum + size.variants.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0), 0);
        const sewingQty = batch.sewingData?.actualQuantities ? batch.sewingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const finishingQty = batch.finishingData?.actualQuantities ? batch.finishingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const ironingQty = batch.ironingData?.actualQuantities ? batch.ironingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const needsPrintEmb = batch.executionType && batch.executionType !== "بدون طباعة / تطريز";

        const baseItem = {
          id: `batch-${batch.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          batchNumber: batch.batchNumber,
        };

        if (batch.ironingData?.status === 'مكتمل') {
           packing.push({ ...baseItem, quantity: ironingQty || finishingQty || sewingQty || initialQty, details: "متاح للتغليف", tab: 'packing' });
        } else if (batch.ironingData?.status === 'جاري') {
          ironing.push({ ...baseItem, quantity: finishingQty || sewingQty || initialQty, details: "جاري المكواة", tab: 'ironing' });
        } else if (batch.finishingData?.status === 'مكتمل') {
          ironing.push({ ...baseItem, quantity: finishingQty || sewingQty || initialQty, details: "بانتظار المكواة", tab: 'ironing' });
        } else if (batch.finishingData?.status === 'جاري') {
          finishing.push({ ...baseItem, quantity: sewingQty || initialQty, details: "جاري التشطيب", tab: 'finish' });
        } else if (batch.sewingData?.status === 'مكتمل') {
          finishing.push({ ...baseItem, quantity: sewingQty || initialQty, details: "بانتظار التشطيب", tab: 'finish' });
        } else if (batch.sewingData?.status === 'جاري') {
          sewing.push({ ...baseItem, quantity: initialQty, details: batch.sewingData?.manufacturingType || "جاري الخياطة", tab: 'sew' });
        } else if (needsPrintEmb && (batch.printEmbroideryStatus === 'مكتمل' || batch.printEmbroideryStatus === 'تم التخطي')) {
          sewing.push({ ...baseItem, quantity: initialQty, details: "بانتظار الخياطة", tab: 'sew' });
        } else if (needsPrintEmb && batch.printEmbroideryStatus === 'في المطبعة / التطريز') {
          printEmb.push({ ...baseItem, quantity: initialQty, details: batch.executionType || "في المطبعة/التطريز", tab: 'print' });
        } else if (batch.prepStatus === 'مكتمل') {
          if (needsPrintEmb) {
            printEmb.push({ ...baseItem, quantity: initialQty, details: "بانتظار الطباعة/التطريز", tab: 'print' });
          } else {
            sewing.push({ ...baseItem, quantity: initialQty, details: "بانتظار الخياطة", tab: 'sew' });
          }
        } else {
          preparation.push({ ...baseItem, quantity: initialQty, details: "جاري التجهيز", tab: 'prep' });
        }
      });
    });

    return { cutting, preparation, printEmb, sewing, finishing, ironing, packing };
  };

  const kanbanData = getKanbanData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {factory?.logoUrl && (
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center overflow-hidden shrink-0">
               <img src={factory.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{factory?.name || "لوحة التحكم"}</h2>
            <p className="text-slate-500 mt-1">
              نظرة عامة على أوامر الإنتاج الأولي
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("form")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-medium"
        >
          <span>إنشاء أمر إنتاج أولي</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`bg-white rounded-xl border ${stat.borderColor} p-6 shadow-sm transition-all ${
              stat.clickable ? 'cursor-pointer hover:shadow-md hover:border-indigo-300' : ''
            } ${stat.active ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                  {stat.title}
                  {stat.clickable && (
                    stat.active ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-indigo-500" />
                  )}
                </p>
                <p className="text-3xl font-bold text-slate-800">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      
      {showOrdersTable && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mt-4">
          <div className="p-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              تفاصيل جميع الأوامر
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border-b border-slate-200 p-3 font-semibold">رقم الأمر</th>
                  <th className="border-b border-slate-200 p-3 font-semibold">العميل</th>
                  <th className="border-b border-slate-200 p-3 font-semibold">الحالة</th>
                  <th className="border-b border-slate-200 p-3 font-semibold">المقاسات</th>
                  <th className="border-b border-slate-200 p-3 font-semibold text-center">العدد المطلوب</th>
                  <th className="border-b border-slate-200 p-3 font-semibold text-center">تكلفة م. للقطعة</th>
                  <th className="border-b border-slate-200 p-3 font-semibold text-center">تكلفة ف. للقطعة</th>
                  <th className="border-b border-slate-200 p-3 font-semibold text-center">سعر البيع</th>
                  <th className="border-b border-slate-200 p-3 font-semibold text-center">المتبقي بالمخزن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">لا توجد أوامر مسجلة</td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const costAnalysis = calculateOrderCostAnalysis(order);
                    const sizesStr = (order.sizes || []).map(s => s.size).join(', ');
                    const totalRequired = (order.sizes || []).reduce((sum, s) => sum + s.variants.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0), 0);
                    
                    // Calculate Total Available (from Ironing or initial sizes)
                    let totalAvailable = 0;
                    let hasActualData = false;
                    order.batches?.forEach(b => {
                      if (b.ironingData?.status === 'مكتمل' && b.ironingData.actualQuantities) {
                        hasActualData = true;
                        b.ironingData.actualQuantities.forEach(q => {
                          totalAvailable += (Number(q.actualQuantity ?? q.quantity) || 0);
                        });
                      }
                    });
                    if (!hasActualData) {
                      totalAvailable = totalRequired;
                    }
                    
                    // Subtract Packed/Invoiced
                    let totalInvoiced = 0;
                    order.packingInvoices?.forEach(inv => {
                      inv.variants.forEach(v => {
                        totalInvoiced += (Number(v.quantity) || 0);
                      });
                    });
                    
                    const remainingInStock = totalAvailable - totalInvoiced;
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <button 
                            onClick={() => onNavigateToOrder?.(order.id, "production")} 
                            className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline"
                          >
                            {order.orderNumber}
                          </button>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{order.customerName || '—'}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs whitespace-nowrap">
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-xs truncate max-w-[150px]" title={sizesStr}>
                          {sizesStr}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{totalRequired}</td>
                        <td className="p-3 text-center text-slate-600">
                          {Number(costAnalysis.totalStandardPerPiece).toFixed(2)}
                        </td>
                        <td className="p-3 text-center text-slate-600">
                          {costAnalysis.isActualComplete ? Number(costAnalysis.totalActualPerPiece).toFixed(2) : <span className="text-amber-500 text-xs">غير مكتمل</span>}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600">
                          {order.sellingPrice ? Number(order.sellingPrice).toFixed(2) : '—'}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-600">
                          {remainingInStock}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMap && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mt-4">
          <div className="p-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              خريطة التشغيل الحالية (تفاصيل الباتشات بكل مرحلة)
            </h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-[800px]">
              {/* Cutting Column */}
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">القص (الأوامر)</h4>
                <div className="space-y-3">
                  {kanbanData.cutting.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.cutting.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-slate-200 text-sm">
                        <div className="font-bold text-slate-800 mb-1"><button onClick={() => onNavigateToOrder?.(item.orderId, "cut")} className="hover:text-indigo-600 hover:underline text-right">{item.orderNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">إجمالي الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preparation Column */}
              <div className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-3">التجهيز (باتشات)</h4>
                <div className="space-y-3">
                  {kanbanData.preparation.length === 0 ? (
                    <p className="text-sm text-blue-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.preparation.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-blue-100 text-sm">
                        <div className="font-bold text-slate-800 mb-1">{item.orderNumber} - <button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "prep")} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Print / Embroidery Column */}
              <div className="flex-1 bg-amber-50 rounded-lg p-3 border border-amber-200">
                <h4 className="font-semibold text-amber-700 border-b border-amber-200 pb-2 mb-3">الطباعة والتطريز (باتشات)</h4>
                <div className="space-y-3">
                  {kanbanData.printEmb.length === 0 ? (
                    <p className="text-sm text-amber-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.printEmb.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-amber-100 text-sm">
                        <div className="font-bold text-slate-800 mb-1">{item.orderNumber} - <button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "print")} className="text-amber-600 hover:text-amber-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sewing Column */}
              <div className="flex-1 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <h4 className="font-semibold text-emerald-700 border-b border-emerald-200 pb-2 mb-3">الخياطة (باتشات)</h4>
                <div className="space-y-3">
                  {kanbanData.sewing.length === 0 ? (
                    <p className="text-sm text-emerald-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.sewing.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-emerald-100 text-sm">
                        <div className="font-bold text-slate-800 mb-1">{item.orderNumber} - <button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "sew")} className="text-emerald-600 hover:text-emerald-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Finishing Column */}
              <div className="flex-1 bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <h4 className="font-semibold text-indigo-700 border-b border-indigo-200 pb-2 mb-3">التشطيب (باتشات)</h4>
                <div className="space-y-3">
                  {kanbanData.finishing.length === 0 ? (
                    <p className="text-sm text-indigo-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.finishing.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-indigo-100 text-sm">
                        <div className="font-bold text-slate-800 mb-1">{item.orderNumber} - <button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "finish")} className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>


              {/* Ironing Column */}
              <div className="flex-1 bg-violet-50 rounded-lg p-3 border border-violet-200">
                <h4 className="font-semibold text-violet-700 border-b border-violet-200 pb-2 mb-3">المكواة (باتشات)</h4>
                <div className="space-y-3">
                  {kanbanData.ironing.length === 0 ? (
                    <p className="text-sm text-violet-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.ironing.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-violet-100 text-sm">
                        <div className="font-bold text-slate-800 mb-1">{item.orderNumber} - <button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "ironing")} className="text-violet-600 hover:text-violet-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Packing Column */}
              <div className="flex-1 bg-fuchsia-50 rounded-lg p-3 border border-fuchsia-200">
                <h4 className="font-semibold text-fuchsia-700 border-b border-fuchsia-200 pb-2 mb-3">التغليف (باتشات جاهزة)</h4>
                <div className="space-y-3">
                  {kanbanData.packing.length === 0 ? (
                    <p className="text-sm text-fuchsia-400 text-center py-4">لا يوجد</p>
                  ) : (
                    kanbanData.packing.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-fuchsia-100 text-sm">
                        <div className="font-bold text-slate-800 mb-1">{item.orderNumber} - <button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "packing")} className="text-fuchsia-600 hover:text-fuchsia-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button></div>
                        <div className="text-xs text-slate-500 mb-2">الكمية: <span className="font-semibold text-slate-700">{item.quantity}</span></div>
                        <span className="inline-block px-2 py-1 bg-fuchsia-100 text-fuchsia-700 rounded text-xs">{item.details}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          مؤشرات التكلفة (لجميع الأوامر)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  سعر القطعة المعياري
                </p>
                {costMetrics.totalStandardQty > 0 ? (
                  <p className="text-3xl font-bold text-indigo-700">
                    {Number(costMetrics.averageStandardUnitCost).toFixed(2)}{" "}
                    <span className="text-sm text-slate-500 font-normal">
                      جنيه
                    </span>
                  </p>
                ) : (
                  <p className="text-xl font-bold text-slate-400 mt-2">
                    غير متاح
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-indigo-50">
                <Calculator className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            {costMetrics.totalStandardQty > 0 && (
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2 rounded">
                <p>
                  إجمالي التكلفة المعيارية:{" "}
                  {Number(costMetrics.totalStandardCost).toFixed(2)} جنيه
                </p>
                <p>الكمية المعيارية: {costMetrics.totalStandardQty} قطعة</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  سعر القطعة الفعلي
                </p>
                <p className="text-xl font-bold text-slate-400 mt-2">
                  غير متاح بعد
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-100">
                <CircleDollarSign className="w-6 h-6 text-slate-400" />
              </div>
            </div>
            <div className="text-xs text-amber-600 space-y-1 bg-amber-50 p-2 rounded">
              <p>التكلفة الفعلية غير مكتملة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
