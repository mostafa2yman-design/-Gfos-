const fs = require('fs');

let content = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

// Replace overflow-hidden with overflow-visible in the container of sizes
content = content.replace(/<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">\\s*<div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">/, '<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">\n            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-xl">');

fs.writeFileSync('src/components/ProductionOrderForm.tsx', content);

