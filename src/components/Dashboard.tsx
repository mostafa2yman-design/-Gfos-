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
  Tag,
  Box,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  X,
  Scissors,
} from "lucide-react";
import { calculateGlobalCostMetrics, calculateOrderCostAnalysis } from "../lib/costUtils";

interface BatchSizeItem {
  size: string;
  quantity: number;
}

interface StageItem {
  id: string;
  orderNumber: string;
  orderId: string;
  customerName?: string;
  styleName: string;
  category?: string;
  cutOrderNumber?: string;
  batchNumber?: string;
  batchSizes: BatchSizeItem[];
  sizeSummary: string;
  colors: string[];
  quantity: number;
  details?: string;
  isOrderOnly?: boolean;
  tab?: string;
}

interface KanbanCardProps {
  key?: string;
  item: StageItem;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

function KanbanCard({ item, onNavigateToOrder }: KanbanCardProps) {
  return (
    <div className="bg-white rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all border border-slate-200/90 hover:border-indigo-400 space-y-2.5 text-sm group">
      {/* Header: Order Number & Batch Number */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex flex-col min-w-0">
          <button
            onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "cut")}
            className="font-black text-slate-900 hover:text-indigo-600 transition-colors text-right flex items-center gap-1 text-xs group-hover:text-indigo-600 truncate"
            title="انتقال إلى تفاصيل أمر الإنتاج"
          >
            <span>{item.orderNumber}</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
          </button>
          {item.customerName && (
            <span className="text-[10px] text-slate-500 font-medium truncate" title={item.customerName}>
              {item.customerName}
            </span>
          )}
        </div>

        {item.batchNumber ? (
          <button
            onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "prep")}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-black rounded-lg text-xs border border-indigo-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="فتح مرحلة الباتش"
          >
            باتش {item.batchNumber}
          </button>
        ) : (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md text-[11px] shrink-0">
            أمر كلي
          </span>
        )}
      </div>

      {/* اسم القصة (Style / Cut Name) - Prominent Box */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-lg p-2.5 border border-slate-200/90 space-y-1">
        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-1 text-indigo-600 font-extrabold">
            <Scissors className="w-3 h-3 stroke-[2.5]" />
            اسم القصة / الموديل:
          </span>
          {item.category && (
            <span className="text-[10px] font-semibold text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
              {item.category}
            </span>
          )}
        </div>
        <div className="font-black text-slate-900 text-sm truncate" title={`اسم القصة: ${item.styleName}`}>
          {item.styleName || "بدون اسم قصة"}
        </div>
        {item.cutOrderNumber && (
          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
            <span>إذن قص:</span>
            <span className="font-bold text-slate-700">{item.cutOrderNumber}</span>
          </div>
        )}
      </div>

      {/* مقاس الباتش (Batch Size / Sizes) - High Visibility Badge */}
      {item.batchSizes && item.batchSizes.length === 1 ? (
        <div className="flex items-center justify-between bg-amber-50/90 border-2 border-amber-300/90 rounded-lg px-3 py-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span className="text-xs font-black text-amber-950">مقاس الباتش:</span>
          </div>
          <span className="font-black text-amber-950 bg-white px-3 py-0.5 rounded-md border border-amber-300 shadow-2xs text-sm tracking-wide">
            {item.sizeSummary}
          </span>
        </div>
      ) : item.batchSizes && item.batchSizes.length > 1 ? (
        <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-lg p-2 text-xs space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-950 font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              مقاسات الباتش:
            </span>
            <span className="font-bold text-amber-900 text-[10px] bg-white border border-amber-200 px-1.5 py-0.5 rounded">
              {item.batchSizes.length} مقاسات
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {item.batchSizes.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 text-amber-950 rounded-md text-xs font-black shadow-2xs"
              >
                <span>{s.size}</span>
                {s.quantity > 0 && (
                  <span className="text-[10px] text-amber-700 font-normal">
                    ({s.quantity})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
          <span className="text-slate-500 font-bold text-[11px]">المقاسات:</span>
          <span className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs">
            {item.sizeSummary || "غير محدد"}
          </span>
        </div>
      )}

      {/* Colors (if present) */}
      {item.colors && item.colors.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 px-0.5">
          <span className="shrink-0 font-bold text-slate-500 text-[11px]">الألوان:</span>
          <div className="flex flex-wrap gap-1">
            {item.colors.map((c, i) => (
              <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/80">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Quantity & Stage Status */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 font-black text-slate-800">
          <Box className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-black">{item.quantity}</span>
          <span className="text-[10px] text-slate-500 font-normal">قطعة</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {item.details}
        </span>
      </div>
    </div>
  );
}

interface DashboardProps {
  onNavigate: (view: "dashboard" | "list" | "form" | "settings") => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

export function Dashboard({ onNavigate, onNavigateToOrder }: DashboardProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [factory, setFactory] = useState<FactorySettings | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showOrdersTable, setShowOrdersTable] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>("الكل");

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
        const orderSizesMap = new Map<string, number>();
        const orderColorsSet = new Set<string>();
        let totalQty = 0;

        (order.sizes || []).forEach((size) => {
          let sQty = 0;
          (size.variants || []).forEach((v) => {
            const q = Number(v.quantity) || 0;
            if (q > 0) {
              sQty += q;
              if (v.color) orderColorsSet.add(v.color);
            }
          });
          if (sQty > 0) {
            orderSizesMap.set(size.size, (orderSizesMap.get(size.size) || 0) + sQty);
            totalQty += sQty;
          }
        });

        const sizeEntries = Array.from(orderSizesMap.entries()).map(([size, quantity]) => ({ size, quantity }));
        const sizeSummary = sizeEntries.length > 0
          ? sizeEntries.map(s => s.size).join('، ')
          : (order.sizes || []).map(s => s.size).join('، ') || "جميع المقاسات";

        cutting.push({
          id: `order-${order.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          cutOrderNumber: order.cutOrder?.cutOrderNumber,
          styleName: order.styleName || "غير محدد",
          category: order.category,
          batchSizes: sizeEntries,
          sizeSummary,
          colors: Array.from(orderColorsSet),
          quantity: totalQty,
          details: order.status,
          isOrderOnly: true,
          tab: "cut",
        });
        return;
      }

      order.batches?.forEach((batch) => {
        const batchSizesMap = new Map<string, number>();
        const batchColorsSet = new Set<string>();
        let initialQty = 0;

        (batch.sizes || []).forEach((size) => {
          let sQty = 0;
          (size.variants || []).forEach((v) => {
            const q = Number(v.quantity) || 0;
            if (q > 0) {
              sQty += q;
              if (v.color) batchColorsSet.add(v.color);
            }
          });
          if (sQty > 0) {
            batchSizesMap.set(size.size, (batchSizesMap.get(size.size) || 0) + sQty);
            initialQty += sQty;
          }
        });

        const sizeEntries = Array.from(batchSizesMap.entries()).map(([size, quantity]) => ({ size, quantity }));
        const sizeSummary = sizeEntries.length > 0
          ? sizeEntries.map(s => s.size).join('، ')
          : (batch.sizes || []).map(s => s.size).join('، ') || "غير محدد";

        const sewingQty = batch.sewingData?.actualQuantities ? batch.sewingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const finishingQty = batch.finishingData?.actualQuantities ? batch.finishingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const ironingQty = batch.ironingData?.actualQuantities ? batch.ironingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const needsPrintEmb = batch.executionType && batch.executionType !== "بدون طباعة / تطريز";

        const baseItem = {
          id: `batch-${batch.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          cutOrderNumber: order.cutOrder?.cutOrderNumber,
          styleName: order.styleName || "غير محدد",
          category: order.category,
          batchNumber: batch.batchNumber,
          batchSizes: sizeEntries,
          sizeSummary,
          colors: Array.from(batchColorsSet),
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

      {showMap && (() => {
        const filterItem = (item: StageItem) => {
          if (selectedSizeFilter !== "الكل") {
            const hasSize =
              (item.batchSizes && item.batchSizes.some((s) => s.size === selectedSizeFilter)) ||
              (item.sizeSummary && item.sizeSummary.includes(selectedSizeFilter));
            if (!hasSize) return false;
          }
          if (!mapSearch.trim()) return true;
          const q = mapSearch.toLowerCase().trim();
          return (
            item.orderNumber.toLowerCase().includes(q) ||
            (item.customerName && item.customerName.toLowerCase().includes(q)) ||
            (item.styleName && item.styleName.toLowerCase().includes(q)) ||
            (item.cutOrderNumber && item.cutOrderNumber.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q)) ||
            (item.batchNumber && item.batchNumber.toLowerCase().includes(q)) ||
            (item.sizeSummary && item.sizeSummary.toLowerCase().includes(q)) ||
            (item.colors && item.colors.some((c) => c.toLowerCase().includes(q))) ||
            (item.details && item.details.toLowerCase().includes(q))
          );
        };

        const allItemsList = [
          ...kanbanData.cutting,
          ...kanbanData.preparation,
          ...kanbanData.printEmb,
          ...kanbanData.sewing,
          ...kanbanData.finishing,
          ...kanbanData.ironing,
          ...kanbanData.packing,
        ];

        const sizeSet = new Set<string>();
        allItemsList.forEach((it) => {
          (it.batchSizes || []).forEach((s) => {
            if (s.size && s.size.trim()) sizeSet.add(s.size.trim());
          });
        });
        const allActiveSizes = Array.from(sizeSet);

        const totalActiveItemsCount = allItemsList.length;
        const totalActivePiecesCount = allItemsList.reduce((sum, it) => sum + (it.quantity || 0), 0);

        const columns = [
          {
            id: "cutting",
            title: "القص",
            subTitle: "أوامر التشغيل",
            items: kanbanData.cutting.filter(filterItem),
            headerBg: "bg-slate-100",
            columnBg: "bg-slate-50/70",
            borderColor: "border-slate-200",
            textColor: "text-slate-800",
            badgeColor: "bg-slate-200 text-slate-800",
          },
          {
            id: "preparation",
            title: "التجهيز",
            subTitle: "باتشات",
            items: kanbanData.preparation.filter(filterItem),
            headerBg: "bg-blue-100/70",
            columnBg: "bg-blue-50/40",
            borderColor: "border-blue-200",
            textColor: "text-blue-900",
            badgeColor: "bg-blue-200 text-blue-900",
          },
          {
            id: "printEmb",
            title: "الطباعة والتطريز",
            subTitle: "باتشات",
            items: kanbanData.printEmb.filter(filterItem),
            headerBg: "bg-amber-100/70",
            columnBg: "bg-amber-50/40",
            borderColor: "border-amber-200",
            textColor: "text-amber-900",
            badgeColor: "bg-amber-200 text-amber-900",
          },
          {
            id: "sewing",
            title: "الخياطة",
            subTitle: "باتشات",
            items: kanbanData.sewing.filter(filterItem),
            headerBg: "bg-emerald-100/70",
            columnBg: "bg-emerald-50/40",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-900",
            badgeColor: "bg-emerald-200 text-emerald-900",
          },
          {
            id: "finishing",
            title: "التشطيب",
            subTitle: "باتشات",
            items: kanbanData.finishing.filter(filterItem),
            headerBg: "bg-indigo-100/70",
            columnBg: "bg-indigo-50/40",
            borderColor: "border-indigo-200",
            textColor: "text-indigo-900",
            badgeColor: "bg-indigo-200 text-indigo-900",
          },
          {
            id: "ironing",
            title: "المكواة",
            subTitle: "باتشات",
            items: kanbanData.ironing.filter(filterItem),
            headerBg: "bg-violet-100/70",
            columnBg: "bg-violet-50/40",
            borderColor: "border-violet-200",
            textColor: "text-violet-900",
            badgeColor: "bg-violet-200 text-violet-900",
          },
          {
            id: "packing",
            title: "التغليف",
            subTitle: "جاهز للتسليم",
            items: kanbanData.packing.filter(filterItem),
            headerBg: "bg-fuchsia-100/70",
            columnBg: "bg-fuchsia-50/40",
            borderColor: "border-fuchsia-200",
            textColor: "text-fuchsia-900",
            badgeColor: "bg-fuchsia-200 text-fuchsia-900",
          },
        ];

        return (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mt-4">
            {/* Header with Title & Stats */}
            <div className="p-4 border-b border-indigo-100 bg-indigo-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-2xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2">
                    خريطة التشغيل وتتبع الباتشات
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      مراحل الإنتاج
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تتبع تفصيلي لكل باتش يشمل اسم القصة، مقاس الباتش، والكميات الجاري تنفيذها
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold self-stretch md:self-auto justify-between md:justify-end">
                <span className="bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-2xs">
                  إجمالي الباتشات: <span className="text-indigo-600">{totalActiveItemsCount}</span>
                </span>
                <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-2xs">
                  إجمالي القطع: {totalActivePiecesCount} قطعة
                </span>
              </div>
            </div>

            {/* Filter Bar: Quick Search & Size Filter Chips */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  placeholder="بحث باسم القصة، رقم الأوردر، الباتش، المقاس..."
                  className="w-full pr-9 pl-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 font-medium"
                />
                {mapSearch && (
                  <button
                    onClick={() => setMapSearch("")}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Size Filter Pills */}
              {allActiveSizes.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
                  <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap flex items-center gap-1">
                    <Filter className="w-3 h-3 text-indigo-600" />
                    تصفية بالمقاس:
                  </span>
                  <button
                    onClick={() => setSelectedSizeFilter("الكل")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                      selectedSizeFilter === "الكل"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    الكل
                  </button>
                  {allActiveSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSizeFilter(size)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                        selectedSizeFilter === size
                          ? "bg-amber-500 text-white shadow-2xs font-extrabold"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-amber-300 hover:bg-amber-50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kanban Columns */}
            <div className="p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-[1250px]">
                {columns.map((col) => {
                  const totalColPieces = col.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
                  return (
                    <div
                      key={col.id}
                      className={`flex-1 min-w-[260px] max-w-[320px] ${col.columnBg} rounded-xl p-3 border ${col.borderColor} flex flex-col`}
                    >
                      {/* Column Header */}
                      <div className={`p-3 rounded-lg border ${col.borderColor} ${col.headerBg} mb-3 shadow-2xs`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`font-bold text-sm ${col.textColor}`}>{col.title}</h4>
                            <span className="text-[11px] text-slate-500 font-medium">({col.subTitle})</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${col.badgeColor}`}>
                            {col.items.length}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1.5 flex items-center justify-between font-medium">
                          <span>إجمالي القطع:</span>
                          <span className="font-bold text-slate-800">{totalColPieces} قطعة</span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-0.5 scrollbar-thin">
                        {col.items.length === 0 ? (
                          <div className="text-center py-8 px-2 border-2 border-dashed border-slate-200/80 rounded-xl bg-white/60">
                            <Layers className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-xs text-slate-400 font-medium">لا توجد باتشات حالياً</p>
                          </div>
                        ) : (
                          col.items.map((item) => (
                            <KanbanCard key={item.id} item={item} onNavigateToOrder={onNavigateToOrder} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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
