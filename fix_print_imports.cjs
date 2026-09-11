const fs = require('fs');
let content = fs.readFileSync('src/components/print/workorders/PackingWorkOrderPrint.tsx', 'utf8');

content = content.replace(/'\.\.\/PrintHeader'/, "'../layout/PrintHeader'");
content = content.replace(/'\.\.\/PrintSignatures'/, "'../layout/PrintSignatures'");
content = content.replace(/'\.\.\/PrintLayout'/, "'../layout/PrintLayout'");

fs.writeFileSync('src/components/print/workorders/PackingWorkOrderPrint.tsx', content);
