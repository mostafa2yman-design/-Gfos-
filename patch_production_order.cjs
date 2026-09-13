const fs = require('fs');
let content = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

const replacement = `
            {!isReadOnly && order.status === "مسودة" && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg font-bold text-lg"
                >
                  <Check className="w-5 h-5" />
                  اعتماد
                </button>
              </div>
            )}
            {(isReadOnly || order.status !== "مسودة") && order.id && (
              <div className="mt-6">
                <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-3.5 rounded-xl font-bold text-lg shadow-sm">
                  <Check className="w-5 h-5" />
                  تم الاعتماد
                </div>
              </div>
            )}
`;

content = content.replace(
  /\{\!isReadOnly && order\.status === "مسودة" && \([\s\S]*?اعتماد\s*<\/button>\s*<\/div>\s*\)\}/,
  replacement
);

fs.writeFileSync('src/components/ProductionOrderForm.tsx', content);
