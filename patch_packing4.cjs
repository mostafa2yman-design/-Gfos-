const fs = require('fs');
let content = fs.readFileSync('src/components/PackingForm.tsx', 'utf8');

content = content.replace(/parseInt\(e\.target\.value\)/g, 'parseInt(e.target.value as string)');

fs.writeFileSync('src/components/PackingForm.tsx', content);
