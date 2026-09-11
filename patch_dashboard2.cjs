const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// For preparation
content = content.replace(
  /onClick=\{\(\) => onNavigateToOrder\?\.\(item\.orderId, "prep"\)\}/g,
  'onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "prep")}'
);

// For printEmb
content = content.replace(
  /onClick=\{\(\) => onNavigateToOrder\?\.\(item\.orderId, "print"\)\}/g,
  'onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "print")}'
);
content = content.replace(
  /<span className="font-bold text-amber-600">باتش \{item\.batchNumber\}<\/span>/g,
  '<button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "print")} className="text-amber-600 hover:text-amber-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button>'
);

// For sewing
content = content.replace(
  /onClick=\{\(\) => onNavigateToOrder\?\.\(item\.orderId, "sew"\)\}/g,
  'onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "sew")}'
);
content = content.replace(
  /<span className="font-bold text-emerald-600">باتش \{item\.batchNumber\}<\/span>/g,
  '<button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "sew")} className="text-emerald-600 hover:text-emerald-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button>'
);

// For finishing
content = content.replace(
  /onClick=\{\(\) => onNavigateToOrder\?\.\(item\.orderId, "finish"\)\}/g,
  'onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "finish")}'
);
content = content.replace(
  /<span className="font-bold text-purple-600">باتش \{item\.batchNumber\}<\/span>/g,
  '<button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "finish")} className="text-purple-600 hover:text-purple-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button>'
);

// For ironing
content = content.replace(
  /onClick=\{\(\) => onNavigateToOrder\?\.\(item\.orderId, "ironing"\)\}/g,
  'onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "ironing")}'
);
content = content.replace(
  /<span className="font-bold text-orange-600">باتش \{item\.batchNumber\}<\/span>/g,
  '<button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "ironing")} className="text-orange-600 hover:text-orange-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button>'
);

// For packing
content = content.replace(
  /onClick=\{\(\) => onNavigateToOrder\?\.\(item\.orderId, "packing"\)\}/g,
  'onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "packing")}'
);
content = content.replace(
  /<span className="font-bold text-teal-600">باتش \{item\.batchNumber\}<\/span>/g,
  '<button onClick={() => onNavigateToOrder?.(item.orderId, item.tab || "packing")} className="text-teal-600 hover:text-teal-800 hover:underline transition-colors font-bold text-sm">باتش {item.batchNumber}</button>'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
