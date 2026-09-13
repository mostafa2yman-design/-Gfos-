const fs = require('fs');

let content = fs.readFileSync('src/components/print/layout/PrintSignatures.tsx', 'utf8');
content = content.replace(/\{ signatures \}/, '{ signatures = [] }');
fs.writeFileSync('src/components/print/layout/PrintSignatures.tsx', content);

