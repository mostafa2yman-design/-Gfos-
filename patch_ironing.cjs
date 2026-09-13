const fs = require('fs');
let content = fs.readFileSync('src/components/IroningForm.tsx', 'utf8');

const isReadOnlyRegex = /const isOrderReadOnly = [^\n]+;/;
const newIsReadOnly = `const isFullyApproved = batches.length > 0 && batches.every(b => b.ironingData?.status === 'مكتمل');
  const isOrderReadOnly = isFullyApproved || ['المكواة مكتملة', 'مغلق'].includes(order.status);`;

content = content.replace(isReadOnlyRegex, newIsReadOnly);

const buttonRegex = /\{\!isOrderReadOnly && \([\s\S]*?اعتماد المكواة بالكامل\s*<\/button>\s*\)\}/;
const newButton = `{!isFullyApproved ? (
              <button
                onClick={approveAllIroning}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                اعتماد المكواة بالكامل
              </button>
            ) : (
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-sm shadow-sm">
                  <CheckSquare className="w-4 h-4" />
                  تم الاعتماد بالكامل
               </div>
            )}`;

content = content.replace(buttonRegex, newButton);
fs.writeFileSync('src/components/IroningForm.tsx', content);
