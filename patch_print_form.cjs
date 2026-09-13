const fs = require('fs');
let content = fs.readFileSync('src/components/PrintEmbroideryForm.tsx', 'utf8');

const replacement = `            {!isReadOnly && (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center justify-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
                >
                  <Check className="w-4 h-4" />
                  اعتماد
                </button>
              </>
            )}
            {isReadOnly && (
                <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex-1 md:flex-none">
                  <Check className="w-4 h-4" />
                  تم الاعتماد
                </div>
            )}`;

content = content.replace(/\{\!isReadOnly && \([\s\S]*?اعتماد\s*<\/button>\s*<\/>\s*\)\}/, replacement);
fs.writeFileSync('src/components/PrintEmbroideryForm.tsx', content);
