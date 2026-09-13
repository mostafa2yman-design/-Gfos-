const fs = require('fs');

let content = fs.readFileSync('src/components/print/workorders/PackingWorkOrderPrint.tsx', 'utf8');
content = content.replace(/<PrintSignatures \/>/, '<PrintSignatures signatures={[{ role: "مسئول التغليف" }, { role: "المستلم" }]} />');
fs.writeFileSync('src/components/print/workorders/PackingWorkOrderPrint.tsx', content);

