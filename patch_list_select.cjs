const fs = require('fs');

let content = fs.readFileSync('src/components/ProductionOrdersList.tsx', 'utf8');

if (!content.includes('ChevronDown className="absolute left-3')) {
    content = content.replace(/<Filter className="absolute right-3 top-1\/2 -translate-y-1\/2 text-slate-400 w-4 h-4 pointer-events-none" \/>\s*<select/g, '<Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />\n              <select');
    
    content = content.replace(/<option value="مغلق">مغلق<\/option>\s*<\/select>/, '<option value="مغلق">مغلق</option>\n              </select>\n              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />');
    
    if(!content.includes('ChevronDown')) {
        content = content.replace(/import \{/, 'import { ChevronDown, ');
    }
    fs.writeFileSync('src/components/ProductionOrdersList.tsx', content);
}

