const fs = require('fs');
let content = fs.readFileSync('src/components/PackingForm.tsx', 'utf8');

content = content.replace(/onChange=\{\(e\) => handleVariantChange/g, 'onChange={(e: any) => handleVariantChange');

fs.writeFileSync('src/components/PackingForm.tsx', content);
