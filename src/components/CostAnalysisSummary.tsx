import React from "react";
import { ProductionOrder } from "../types";
import { calculateOrderCostAnalysis } from "../lib/costUtils";
import {
  Calculator,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface CostAnalysisSummaryProps {
  order: ProductionOrder;
}

export function CostAnalysisSummary({ order }: CostAnalysisSummaryProps) {
  const analysis = calculateOrderCostAnalysis(order);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "غير متاحة";
    return `${val.toFixed(2)} جنيه`;
  };

  const getDeviationColor = (val: number | null) => {
    if (val === null) return "text-slate-500";
    if (val > 0) return "text-red-600"; // Over budget
    if (val < 0) return "text-emerald-600"; // Under budget
    return "text-slate-500";
  };

  const renderDeviationIcon = (val: number | null) => {
    if (val === null) return <Minus className="w-5 h-5 text-slate-400" />;
    if (val > 0) return <TrendingUp className="w-5 h-5 text-red-600" />;
    if (val < 0) return <TrendingDown className="w-5 h-5 text-emerald-600" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
        <Calculator className="w-6 h-6 text-indigo-600" />
        ملخص تكلفة الإنتاج
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">
            تكلفة القطعة المعيارية
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(analysis.totalStandardPerPiece)}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">
            تكلفة القطعة الفعلية
          </p>
          {analysis.isActualComplete ? (
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(analysis.totalActualPerPiece)}
            </p>
          ) : (
            <p className="text-lg font-bold text-slate-500 mt-1">غير مكتملة</p>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border ${analysis.deviationValue !== null && analysis.deviationValue > 0 ? "bg-red-50 border-red-100" : analysis.deviationValue !== null && analysis.deviationValue < 0 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}
        >
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
            الانحراف
            {renderDeviationIcon(analysis.deviationValue)}
          </p>
          {analysis.deviationValue !== null ? (
            <p
              className={`text-2xl font-bold ${getDeviationColor(analysis.deviationValue)}`}
            >
              {analysis.deviationValue > 0 ? "+" : ""}
              {formatCurrency(analysis.deviationValue)}
            </p>
          ) : (
            <p className="text-lg font-bold text-slate-500 mt-1">غير متاح</p>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border ${analysis.deviationPercentage !== null && analysis.deviationPercentage > 0 ? "bg-red-50 border-red-100" : analysis.deviationPercentage !== null && analysis.deviationPercentage < 0 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}
        >
          <p className="text-sm font-medium text-slate-500 mb-1">
            نسبة الانحراف
          </p>
          {analysis.deviationPercentage !== null ? (
            <p
              className={`text-2xl font-bold ${getDeviationColor(analysis.deviationPercentage)}`}
            >
              {analysis.deviationPercentage > 0 ? "+" : ""}
              {analysis.deviationPercentage.toFixed(2)}%
            </p>
          ) : (
            <p className="text-lg font-bold text-slate-500 mt-1">غير متاح</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4">
            تفاصيل التكلفة المعيارية للقطعة
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold border-b">عنصر التكلفة</th>
                  <th className="px-4 py-3 font-bold border-b">
                    التكلفة (جنيه)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-600">القماش</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {analysis.fabric.standardPerPiece.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">الإكسسوارات</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {analysis.accessories.standardPerPiece.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">
                    الطباعة / التطريز
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {analysis.printEmbroidery.standardPerPiece.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">
                    الخياطة
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {analysis.sewing.standardPerPiece.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">
                    الإجمالي المعياري
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-700">
                    {analysis.totalStandardPerPiece.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">
                    الخياطة
                  </td>
                  <td className="px-4 py-3">
                    {analysis.sewing.standardPerPiece.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(analysis.sewing.actualPerPiece)}
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${getDeviationColor(analysis.sewing.actualPerPiece !== null ? analysis.sewing.actualPerPiece - analysis.sewing.standardPerPiece : null)}`}
                  >
                    {analysis.sewing.actualPerPiece !== null
                      ? (analysis.sewing.actualPerPiece -
                          analysis.sewing.standardPerPiece >
                        0
                          ? "+"
                          : "") +
                        (
                          analysis.sewing.actualPerPiece -
                          analysis.sewing.standardPerPiece
                        ).toFixed(2)
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            تفاصيل التكلفة الفعلية للقطعة
            {!analysis.isActualComplete && (
              <span className="text-xs font-normal bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                غير مكتملة
              </span>
            )}
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold border-b">عنصر التكلفة</th>
                  <th className="px-4 py-3 font-bold border-b">
                    التكلفة (جنيه)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-600">القماش</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatCurrency(analysis.fabric.actualPerPiece)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">الإكسسوارات</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatCurrency(analysis.accessories.actualPerPiece)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">
                    الطباعة / التطريز
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatCurrency(analysis.printEmbroidery.actualPerPiece)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">
                    الخياطة
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatCurrency(analysis.sewing.actualPerPiece)}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">
                    الإجمالي الفعلي
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-700">
                    {analysis.isActualComplete
                      ? formatCurrency(analysis.totalActualPerPiece)
                      : "غير مكتمل"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deviation Breakdown */}
      {analysis.isActualComplete && (
        <div className="mt-8">
          <h4 className="text-lg font-bold text-slate-800 mb-4">
            تحليل الانحراف التفصيلي
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold border-b">عنصر التكلفة</th>
                  <th className="px-4 py-3 font-bold border-b">المعياري</th>
                  <th className="px-4 py-3 font-bold border-b">الفعلي</th>
                  <th className="px-4 py-3 font-bold border-b">الانحراف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-600">
                    الطباعة / التطريز
                  </td>
                  <td className="px-4 py-3">
                    {analysis.printEmbroidery.standardPerPiece.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(analysis.printEmbroidery.actualPerPiece)}
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${getDeviationColor(analysis.printEmbroidery.actualPerPiece !== null ? analysis.printEmbroidery.actualPerPiece - analysis.printEmbroidery.standardPerPiece : null)}`}
                  >
                    {analysis.printEmbroidery.actualPerPiece !== null
                      ? (analysis.printEmbroidery.actualPerPiece -
                          analysis.printEmbroidery.standardPerPiece >
                        0
                          ? "+"
                          : "") +
                        (
                          analysis.printEmbroidery.actualPerPiece -
                          analysis.printEmbroidery.standardPerPiece
                        ).toFixed(2)
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
