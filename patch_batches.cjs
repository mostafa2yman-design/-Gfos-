const fs = require('fs');
let content = fs.readFileSync('src/components/BatchesForm.tsx', 'utf8');

const buttonStr = `<button
              onClick={handleLockBatches}
              disabled={totalBatches !== totalActual}
              className={\`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm \${
                totalBatches === totalActual ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }\`}
            >
              <Check className="w-4 h-4" />
              تثبيت تقسيم الباتشات
            </button>`;

const replacementStr = `<button
              onClick={handleLockBatches}
              disabled={totalBatches !== totalActual}
              className={\`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm \${
                totalBatches === totalActual ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }\`}
            >
              <Check className="w-4 h-4" />
              اعتماد الباتشات
            </button>
          ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg shadow-sm font-medium text-sm">
                <Check className="w-4 h-4" />
                تم الاعتماد
             </div>`;

content = content.replace(buttonStr, replacementStr);
fs.writeFileSync('src/components/BatchesForm.tsx', content);
