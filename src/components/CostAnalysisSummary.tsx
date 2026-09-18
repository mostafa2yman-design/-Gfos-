import React, { useState } from "react";
import { ProductionOrder } from "../types";
import { calculateOrderCostAnalysis } from "../lib/costUtils";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CostAnalysisSummaryProps {
  order: ProductionOrder;
  defaultExpanded?: boolean;
  className?: string;
}

export function CostAnalysisSummary({
  order,
  defaultExpanded = false,
  className = "",
}: CostAnalysisSummaryProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const analysis = calculateOrderCostAnalysis(order);

  React.useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded, order?.id]);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "غير متاحة";
    return `${Number(val).toFixed(2)} جنيه`;
  };

  const getDeviationColor = (val: number | null) => {
    if (val === null) return "text-slate-500";
    if (val > 0) return "text-rose-600"; // Over budget
    if (val < 0) return "text-emerald-600"; // Under budget
    return "text-slate-500";
  };

  const renderDeviationIcon = (val: number | null) => {
    if (val === null) return <Minus className="w-4 h-4 text-slate-400" />;
    if (val > 0) return <TrendingUp className="w-4 h-4 text-rose-600" />;
    if (val < 0) return <TrendingDown className="w-4 h-4 text-emerald-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const renderRow = (label: string, standard: number, actual: number | null) => {
    const deviation = actual !== null ? actual - standard : null;
    const deviationPct =
      deviation !== null && standard > 0 ? (deviation / standard) * 100 : null;

    return (
      <tr key={label} className="hover:bg-slate-50/80 transition-colors">
        <td className="px-4 py-3 text-slate-800 font-bold">{label}</td>
        <td className="px-4 py-3 text-slate-800 font-semibold">{Number(standard).toFixed(2)}</td>
        <td className="px-4 py-3 text-slate-800 font-semibold">
          {actual !== null ? Number(actual).toFixed(2) : "—"}
        </td>
        <td className={`px-4 py-3 font-bold ${getDeviationColor(deviation)}`}>
          {deviation !== null
            ? (deviation > 0 ? "+" : "") + Number(deviation).toFixed(2)
            : "—"}
        </td>
        <td className={`px-4 py-3 font-bold ${getDeviationColor(deviationPct)}`}>
          {deviationPct !== null
            ? (deviationPct > 0 ? "+" : "") + Number(deviationPct).toFixed(2) + "%"
            : "—"}
        </td>
      </tr>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-200 ${className}`}
      dir="rtl"
    >
      {/* Top Bar with Show/Hide Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Calculator className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 text-base">
                تحليل تكلفة أمر الإنتاج
              </h3>
              {!analysis.isActualComplete && (
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                  التكلفة الفعلية قيد التنفيذ
                </span>
              )}
              {analysis.isActualComplete && (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md">
                  التكلفة الفعلية مكتملة
                </span>
              )}
            </div>

            {/* Quick overview metrics chips */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-600 flex-wrap">
              <span className="font-medium">
                المعياري / قطعة:{" "}
                <strong className="text-slate-900 font-bold">
                  {formatCurrency(analysis.totalStandardPerPiece)}
                </strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium">
                الفعلي / قطعة:{" "}
                <strong className="text-slate-900 font-bold">
                  {analysis.isActualComplete
                    ? formatCurrency(analysis.totalActualPerPiece)
                    : "قيد التشغيل"}
                </strong>
              </span>
              {analysis.deviationValue !== null && (
                <>
                  <span className="text-slate-300">•</span>
                  <span
                    className={`font-bold inline-flex items-center gap-0.5 ${getDeviationColor(
                      analysis.deviationValue
                    )}`}
                  >
                    الانحراف:{" "}
                    {analysis.deviationValue > 0 ? "+" : ""}
                    {formatCurrency(analysis.deviationValue)}
                    {analysis.deviationPercentage !== null && (
                      <span className="text-[11px] font-semibold">
                        ({analysis.deviationPercentage > 0 ? "+" : ""}
                        {Number(analysis.deviationPercentage).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The Show / Hide Button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-xs cursor-pointer ${
              isExpanded
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
            }`}
            title={isExpanded ? "إخفاء جدول تحليل التكلفة" : "إظهار جدول تحليل التكلفة بالكامل"}
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-4 h-4 stroke-[2.5]" />
                <span>إخفاء</span>
                <ChevronUp className="w-4 h-4 stroke-[2.5] text-slate-500" />
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>إظهار</span>
                <ChevronDown className="w-4 h-4 stroke-[2.5] text-indigo-200" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Content - Only shown when isExpanded is true */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in fade-in-50 duration-200">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 mb-1">
                تكلفة القطعة المعيارية
              </p>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrency(analysis.totalStandardPerPiece)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                إجمالي معتمد قائمة الخامات ومراحل التشغيل
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 mb-1">
                تكلفة القطعة الفعلية
              </p>
              {analysis.isActualComplete ? (
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency(analysis.totalActualPerPiece)}
                </p>
              ) : (
                <p className="text-xl font-bold text-amber-700 mt-1">
                  قيد التشغيل الميداني
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                محسوبة على أساس الأوزان والكميات الفعلية
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-2xs ${
                analysis.deviationValue !== null && analysis.deviationValue > 0
                  ? "bg-rose-50/90 border-rose-200"
                  : analysis.deviationValue !== null && analysis.deviationValue < 0
                  ? "bg-emerald-50/90 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p className="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>قيمة الانحراف / قطعة</span>
                {renderDeviationIcon(analysis.deviationValue)}
              </p>
              {analysis.deviationValue !== null ? (
                <p
                  className={`text-2xl font-black ${getDeviationColor(
                    analysis.deviationValue
                  )}`}
                >
                  {analysis.deviationValue > 0 ? "+" : ""}
                  {formatCurrency(analysis.deviationValue)}
                </p>
              ) : (
                <p className="text-lg font-bold text-slate-500 mt-1">غير متاح</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {analysis.deviationValue !== null && analysis.deviationValue > 0
                  ? "تكلفة زائدة عن المخطط"
                  : analysis.deviationValue !== null && analysis.deviationValue < 0
                  ? "وفر في التكلفة عن المخطط"
                  : "مطابق للتكلفة المعيارية"}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-2xs ${
                analysis.deviationPercentage !== null && analysis.deviationPercentage > 0
                  ? "bg-rose-50/90 border-rose-200"
                  : analysis.deviationPercentage !== null && analysis.deviationPercentage < 0
                  ? "bg-emerald-50/90 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p className="text-xs font-bold text-slate-600 mb-1">
                نسبة الانحراف الإجمالية
              </p>
              {analysis.deviationPercentage !== null ? (
                <p
                  className={`text-2xl font-black ${getDeviationColor(
                    analysis.deviationPercentage
                  )}`}
                >
                  {analysis.deviationPercentage > 0 ? "+" : ""}
                  {Number(analysis.deviationPercentage).toFixed(2)}%
                </p>
              ) : (
                <p className="text-lg font-bold text-slate-500 mt-1">غير متاح</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                نسبة التغير مقارنة بالتكلفة المعيارية
              </p>
            </div>
          </div>

          {/* Full Width Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>جدول تفاصيل التكلفة للقطعة عبر مراحل التشغيل</span>
                {!analysis.isActualComplete && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                    بعض المراحل لم تستكمل بياناتها الفعلية بعد
                  </span>
                )}
              </h4>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-sm text-right whitespace-nowrap">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 border-b font-black">عنصر التكلفة</th>
                    <th className="px-4 py-3.5 border-b font-black">المعياري / قطعة (جنيه)</th>
                    <th className="px-4 py-3.5 border-b font-black">الفعلي / قطعة (جنيه)</th>
                    <th className="px-4 py-3.5 border-b font-black">الانحراف (جنيه)</th>
                    <th className="px-4 py-3.5 border-b font-black">نسبة الانحراف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {renderRow(
                    "القماش",
                    analysis.fabric.standardPerPiece,
                    analysis.fabric.actualPerPiece
                  )}
                  {renderRow(
                    "القص",
                    analysis.cutting?.standardPerPiece || 0,
                    analysis.cutting?.actualPerPiece
                  )}
                  {renderRow(
                    "الإكسسوارات",
                    analysis.accessories.standardPerPiece,
                    analysis.accessories.actualPerPiece
                  )}
                  {renderRow(
                    "الطباعة / التطريز",
                    analysis.printEmbroidery.standardPerPiece,
                    analysis.printEmbroidery.actualPerPiece
                  )}
                  {renderRow(
                    "الخياطة",
                    analysis.sewing.standardPerPiece,
                    analysis.sewing.actualPerPiece
                  )}
                  {renderRow(
                    "التشطيب",
                    analysis.finishing?.standardPerPiece || 0,
                    analysis.finishing?.actualPerPiece
                  )}
                  {renderRow(
                    "المكواة",
                    analysis.ironing?.standardPerPiece || 0,
                    analysis.ironing?.actualPerPiece
                  )}

                  {/* Total Row */}
                  <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 font-black">
                    <td className="px-4 py-4 text-slate-900 font-black text-base">
                      إجمالي تكلفة القطعة
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-black text-base">
                      {Number(analysis.totalStandardPerPiece).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-black text-base">
                      {analysis.isActualComplete &&
                      analysis.totalActualPerPiece !== null
                        ? Number(analysis.totalActualPerPiece).toFixed(2)
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-4 font-black text-base ${getDeviationColor(
                        analysis.deviationValue
                      )}`}
                    >
                      {analysis.deviationValue !== null
                        ? (analysis.deviationValue > 0 ? "+" : "") +
                          Number(analysis.deviationValue).toFixed(2)
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-4 font-black text-base ${getDeviationColor(
                        analysis.deviationPercentage
                      )}`}
                    >
                      {analysis.deviationPercentage !== null
                        ? (analysis.deviationPercentage > 0 ? "+" : "") +
                          Number(analysis.deviationPercentage).toFixed(2) +
                          "%"
                        : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
