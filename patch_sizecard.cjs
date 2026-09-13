const fs = require('fs');

let content = fs.readFileSync('src/components/form/SizeCard.tsx', 'utf8');

// Replace overflow-hidden with overflow-visible in the container
content = content.replace(/<div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">\\s*<div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">/, '<div className="bg-slate-50 rounded-xl border border-slate-200 overflow-visible shadow-sm">\n      <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between rounded-t-xl">');

fs.writeFileSync('src/components/form/SizeCard.tsx', content);

