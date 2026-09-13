const fs = require('fs');

let content = fs.readFileSync('src/components/form/OrderBasicInfo.tsx', 'utf8');

if (!content.includes('ChevronDown')) {
    content = content.replace(/import \{ \n\} from "lucide-react";/, 'import { ChevronDown } from "lucide-react";');
    if (!content.includes('ChevronDown')) {
        content = content.replace(/import React from "react";/, 'import React from "react";\nimport { ChevronDown } from "lucide-react";');
    }
}

// Find the category select block
const selectBlock = `            <div className="relative">
              <select
                value={category}
                disabled={readOnly}
                onChange={(e) => onChange('category', e.target.value)}
                className={\`w-full px-3 py-2 border border-slate-300 rounded-lg appearance-none pr-3 pl-8 transition-shadow \${
                  readOnly 
                    ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                    : 'bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }\`}
              >
                <option value="" disabled>اختر النوع...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>`;

content = content.replace(/<select\s+value=\{category\}[\s\S]*?<\/select>/, selectBlock);

fs.writeFileSync('src/components/form/OrderBasicInfo.tsx', content);

