const fs = require('fs');
let code = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

code = code.replace(`    document.addEventListener("touchstart", handleClickOutside);
    
  const fabricSummary = calculateFabricAnalysis(order, order.cutData);
return () => {`, `    document.addEventListener("touchstart", handleClickOutside);
    return () => {`);

const realRenderIndex = code.indexOf(`  return (
    <div className="space-y-6">`);
code = code.slice(0, realRenderIndex) + `  const fabricSummary = calculateFabricAnalysis(order, order.cutData);\n` + code.slice(realRenderIndex);

fs.writeFileSync('src/components/ProductionOrderForm.tsx', code);
