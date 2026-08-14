import React from 'react';
import { FabricAnalysisSummary } from '../lib/fabricUtils';

interface Props {
  summary: FabricAnalysisSummary;
}

export const FabricSummary: React.FC<Props> = ({ summary }) => {
  const formatNum = (num: number | null | undefined, decimals = 3) => {
    if (num === null || num === undefined) return '—';
    return num.toFixed(decimals);
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const formatDiff = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    return `${num > 0 ? '+' : ''}${num.toFixed(3)}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800">تحليل استهلاك القماش</h3>
      
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm">
              <th className="px-4 py-3 font-semibold">اللون</th>
              <th className="px-4 py-3 font-semibold text-center">الكمية</th>
              <th className="px-4 py-3 font-semibold text-center">المعياري/قطعة</th>
              <th className="px-4 py-3 font-semibold text-center">المطلوب</th>
              <th className="px-4 py-3 font-semibold text-center">الفعلي</th>
              <th className="px-4 py-3 font-semibold text-center">الانحراف</th>
              <th className="px-4 py-3 font-semibold text-center">% الانحراف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.colors.map(c => (
              <tr key={c.color} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{c.color}</td>
                <td className="px-4 py-3 text-center text-slate-600">{c.actualPieces > 0 ? c.actualPieces : c.plannedPieces}</td>
                <td className="px-4 py-3 text-center text-slate-600">{c.standardWeightStr}</td>
                <td className="px-4 py-3 text-center text-slate-600">{formatNum(c.requiredFabric)}</td>
                <td className="px-4 py-3 text-center font-medium text-slate-800">
                  {summary.hasColorLevelActuals ? (c.actualFabric > 0 ? formatNum(c.actualFabric) : 'لم يتم الإدخال') : (summary.totalActualFabric > 0 ? 'غير متاح حسب اللون' : 'لم يتم الإدخال')}
                </td>
                <td className={`px-4 py-3 text-center font-bold ${c.variance && c.variance > 0 ? 'text-red-600' : c.variance && c.variance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {formatDiff(c.variance)}
                </td>
                <td className={`px-4 py-3 text-center font-bold ${c.variancePercentage && c.variancePercentage > 0 ? 'text-red-600' : c.variancePercentage && c.variancePercentage < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {formatPercent(c.variancePercentage)}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <td className="px-4 py-3 text-slate-800">الإجمالي</td>
              <td className="px-4 py-3 text-center text-slate-800">{summary.totalActualPieces > 0 ? summary.totalActualPieces : summary.totalPlannedPieces}</td>
              <td className="px-4 py-3 text-center text-slate-600">{formatNum(summary.averageStandardWeightPerPiece)}</td>
              <td className="px-4 py-3 text-center text-indigo-700">{formatNum(summary.totalRequiredFabric)}</td>
              <td className="px-4 py-3 text-center text-indigo-700">
                {summary.totalActualFabric > 0 ? formatNum(summary.totalActualFabric) : 'لم يتم الإدخال'}
              </td>
              <td className={`px-4 py-3 text-center ${summary.totalVariance && summary.totalVariance > 0 ? 'text-red-600' : summary.totalVariance && summary.totalVariance < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {formatDiff(summary.totalVariance)}
              </td>
              <td className={`px-4 py-3 text-center ${summary.totalVariancePercentage && summary.totalVariancePercentage > 0 ? 'text-red-600' : summary.totalVariancePercentage && summary.totalVariancePercentage < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {formatPercent(summary.totalVariancePercentage)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">الوزن المعياري للقطعة</p>
          <p className="text-xl font-bold text-slate-800">{formatNum(summary.averageStandardWeightPerPiece)} <span className="text-sm font-normal text-slate-500">كجم</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">متوسط الوزن الفعلي للقطعة</p>
          <p className="text-xl font-bold text-indigo-600">
            {summary.averageActualWeightPerPiece ? `${formatNum(summary.averageActualWeightPerPiece)} ` : '— '}
            <span className="text-sm font-normal text-slate-500">كجم</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">انحراف وزن القطعة</p>
          <p className={`text-xl font-bold ${summary.pieceWeightVariance && summary.pieceWeightVariance > 0 ? 'text-red-600' : summary.pieceWeightVariance && summary.pieceWeightVariance < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {summary.pieceWeightVariance ? `${formatDiff(summary.pieceWeightVariance)} ` : '— '}
            <span className="text-sm font-normal text-slate-500">كجم</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">نسبة الانحراف</p>
          <p className={`text-xl font-bold ${summary.pieceWeightVariancePercentage && summary.pieceWeightVariancePercentage > 0 ? 'text-red-600' : summary.pieceWeightVariancePercentage && summary.pieceWeightVariancePercentage < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {formatPercent(summary.pieceWeightVariancePercentage)}
          </p>
        </div>
      </div>
    </div>
  );
};
