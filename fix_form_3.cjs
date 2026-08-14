const fs = require('fs');
let form = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

form = form.replace(/const handleDeleteOrder =\s*\n\s*if \(\!orderId\) return ;/g, 'const handleDeleteOrder = () => {\n    if (!orderId) return;');
form = form.replace(/onConfirm:\s*\n\s*const result = Cmd\.deleteProductionOrder\(order\);/g, 'onConfirm: () => {\n        const result = Cmd.deleteProductionOrder(order);');

// There's a missing closing brace for handleDeleteOrder, let's just make sure it's closed in onCancel
form = form.replace(/setError\(result\.error \|\| "حدث خطأ"\);\s*\n\s*\}\s*\n\s*\},\s*\n\s*onCancel: \(\) => setConfirmConfig\(null\)\s*\n\s*\}\);/g, 'setError(result.error || "حدث خطأ");\n        }\n      },\n      onCancel: () => setConfirmConfig(null)\n    });\n  };');

fs.writeFileSync('src/components/ProductionOrderForm.tsx', form);
