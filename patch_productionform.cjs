const fs = require('fs');
let content = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

if (!content.includes("field === 'sellingPrice'")) {
    content = content.replace(/field === 'standardIroningCostPerPiece'/, "field === 'standardIroningCostPerPiece' || field === 'sellingPrice'");
    content = content.replace(/standardIroningCostPerPiece=\{order.standardIroningCostPerPiece\}/, "standardIroningCostPerPiece={order.standardIroningCostPerPiece}\n            sellingPrice={order.sellingPrice}");
    fs.writeFileSync('src/components/ProductionOrderForm.tsx', content);
}
