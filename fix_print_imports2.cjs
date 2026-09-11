const fs = require('fs');
let content = fs.readFileSync('src/components/print/workorders/PackingWorkOrderPrint.tsx', 'utf8');

content = content.replace(/import \{ PrintLayout \} from '\.\.\/layout\/PrintLayout';\n/, "");
content = content.replace(/<PrintLayout>/g, '<div className="print-page">');
content = content.replace(/<\/PrintLayout>/g, '</div>');

fs.writeFileSync('src/components/print/workorders/PackingWorkOrderPrint.tsx', content);
