const fs = require('fs');
let content = fs.readFileSync('src/components/PackingForm.tsx', 'utf8');

content = content.replace(/invoice\.invoiceDate/g, '(invoice.invoiceDate as string)');
content = content.replace(/ref=\{printRef\}/g, '');

fs.writeFileSync('src/components/PackingForm.tsx', content);
