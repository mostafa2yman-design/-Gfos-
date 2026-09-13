const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(/const sizesStr = order\.sizes\.map/g, 'const sizesStr = (order.sizes || []).map');
content = content.replace(/const totalRequired = order\.sizes\.reduce/g, 'const totalRequired = (order.sizes || []).reduce');

fs.writeFileSync('src/components/Dashboard.tsx', content);
