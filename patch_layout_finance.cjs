const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const newFinanceSection = `          {/* Section 3: Finance */}
          <div>
            <button 
              onClick={() => toggleSection('accounting')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              {expandedSection === 'accounting' ? <ChevronUp className={\`w-4 h-4 \${getPrimaryText(color)}\`} /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex items-center gap-3">
                <span>المحاسبة المالية والحسابات العامة</span>
                <Briefcase className={\`w-5 h-5 \${expandedSection === 'accounting' ? getPrimaryText(color) : 'text-slate-500'}\`} />
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
          </div>`;

content = content.replace(
  /\s*\{\/\* Section 3: Finance \*\/\}\s*<div>\s*<button className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">\s*<ChevronDown className="w-4 h-4" \/>\s*<div className="flex items-center gap-3">\s*<span>المحاسبة المالية والحسابات العامة<\/span>\s*<Briefcase className="w-5 h-5 text-slate-500" \/>\s*<\/div>\s*<\/button>\s*<\/div>/,
  '\n' + newFinanceSection
);

fs.writeFileSync('src/components/Layout.tsx', content);
