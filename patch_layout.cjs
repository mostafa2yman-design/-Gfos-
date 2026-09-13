const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Add Calculator (or appropriate icon) import
if (!content.includes('Calculator')) {
  content = content.replace(/import \{ /, 'import { Calculator, ');
}

content = content.replace(
  /currentView: "dashboard" \| "list" \| "form" \| "settings";/,
  'currentView: "dashboard" | "list" | "form" | "settings" | "accounting_config";'
);

const newNavSection = `
          {/* Section 2: Accounting Configuration */}
          <div>
            <button 
              onClick={() => toggleSection('accounting')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              {expandedSection === 'accounting' ? <ChevronUp className={\`w-4 h-4 \${getPrimaryText(color)}\`} /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex items-center gap-3">
                <span>المحاسبة المالية والحسابات العامة</span>
                <Calculator className={\`w-5 h-5 \${expandedSection === 'accounting' ? getPrimaryText(color) : 'text-slate-500'}\`} />
              </div>
            </button>

            {expandedSection === 'accounting' && (
              <div className="mt-1 space-y-1 mb-3">
                <button
                  onClick={() => handleNavClick("accounting_config")}
                  className={\`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all \${radiusClass} \${
                    currentView === "accounting_config"
                      ? \`\${primaryBg} \${color === 'orange' ? 'text-slate-900' : 'text-white'}\`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }\`}
                >
                  التكوين الهيكلي والمالي
                </button>
              </div>
            )}
          </div>
`;

// Insert the new nav section after the closing div of "Section 1: Admin"
// Find the exact place to inject. The structure is:
/*
          {/* Section 1: Admin * /}
          <div>
            <button ...>...</button>
            {expandedSection === 'admin' && (
              <div ...>
                <button ...>
                  الرئيسية
                </button>
                <button ...>
                  قائمة أوامر الإنتاج
                </button>
                <button ...>
                  إنشاء أمر جديد
                </button>
                <button ...>
                  إعدادات النظام
                </button>
              </div>
            )}
          </div>
*/

content = content.replace(/(إعدادات النظام\s*<\/button>\s*<\/div>\s*\)}\s*<\/div>)/, '$1\n' + newNavSection);

fs.writeFileSync('src/components/Layout.tsx', content);
