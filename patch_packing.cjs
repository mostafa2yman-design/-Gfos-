const fs = require('fs');
let content = fs.readFileSync('src/components/PackingForm.tsx', 'utf8');

// fix event bus publish
content = content.replace(/eventBus\.publish\(\{\s*type: 'ORDER_UPDATED',\s*payload: \{ order: updatedOrder \}\s*\}\);/m, 
`eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ORDER_UPDATED' as any,
        aggregateType: 'ProductionOrder',
        aggregateId: updatedOrder.id,
        occurredAt: new Date().toISOString(),
        payload: { order: updatedOrder }
      });`);

// fix unknown type
content = content.replace(/invoice\.invoiceDate\)\.toLocaleDateString\('ar-EG'\)/g, 'String(invoice.invoiceDate)).toLocaleDateString("ar-EG")');

// fix printRef
content = content.replace(/<div className="hidden print:block print:absolute print:inset-0" ref=\{printRef\}>/g, '<div className="hidden print:block print:absolute print:inset-0">');

fs.writeFileSync('src/components/PackingForm.tsx', content);
