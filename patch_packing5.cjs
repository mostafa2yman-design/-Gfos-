const fs = require('fs');
let content = fs.readFileSync('src/components/PackingForm.tsx', 'utf8');

content = content.replace(/handleVariantChange\(inv\.id, size, color,/g, 'handleVariantChange(inv.id, size as string, color as string,');

fs.writeFileSync('src/components/PackingForm.tsx', content);
