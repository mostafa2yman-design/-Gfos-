const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(/text-orange-400/g, '${getPrimaryText(color)}');

fs.writeFileSync('src/components/Layout.tsx', content);
