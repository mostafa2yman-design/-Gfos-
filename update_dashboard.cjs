const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add imports
code = code.replace(
  `import { FileText, ClipboardList, CheckCircle2, Archive, ArrowLeft } from 'lucide-react';`,
  `import { FileText, ClipboardList, CheckCircle2, Archive, ArrowLeft, Calculator, CircleDollarSign } from 'lucide-react';\nimport { calculateGlobalCostMetrics } from '../lib/costUtils';`
);

// Add metrics calculation
code = code.replace(
  `  const stats = [`,
  `  const costMetrics = calculateGlobalCostMetrics(orders);\n\n  const stats = [`
);

// Add new grid for costs
const newGrid = `
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">مؤشرات التكلفة (لجميع الأوامر)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">سعر القطعة المعياري</p>
                {costMetrics.totalStandardQty > 0 ? (
                  <p className="text-3xl font-bold text-indigo-700">
                    {costMetrics.averageStandardUnitCost.toFixed(2)} <span className="text-sm text-slate-500 font-normal">جنيه</span>
                  </p>
                ) : (
                  <p className="text-xl font-bold text-slate-400 mt-2">غير متاح</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-indigo-50">
                <Calculator className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            {costMetrics.totalStandardQty > 0 && (
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2 rounded">
                <p>إجمالي التكلفة المعيارية: {costMetrics.totalStandardCost.toFixed(2)} جنيه</p>
                <p>الكمية المعيارية: {costMetrics.totalStandardQty} قطعة</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">سعر القطعة الفعلي</p>
                <p className="text-xl font-bold text-slate-400 mt-2">غير متاح بعد</p>
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
}`;

code = code.replace(
  `      </div>\n    </div>\n  );\n}`,
  `      </div>` + newGrid
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
