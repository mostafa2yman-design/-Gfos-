const fs = require('fs');
let content = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

const regexToReplace = /\{\s*fabricSummary\s*&&\s*\(\s*<div className="mt-8 space-y-6">\s*<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">/g;

content = content.replace(regexToReplace, `<div className="mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">`);

// Now fix the closing tag issue! Since I removed the `{fabricSummary && (` wrap, I need to remove the matching `)}` at the bottom.
// Let's locate the `)}` that was closing it.
