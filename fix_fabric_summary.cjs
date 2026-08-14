const fs = require('fs');
let code = fs.readFileSync('src/components/FabricSummary.tsx', 'utf8');

// replace the td content for actualFabric
code = code.replace(
  `{summary.hasColorLevelActuals ? (c.actualFabric > 0 ? formatNum(c.actualFabric) : 'لم يتم الإدخال') : 'غير متاح حسب اللون'}`,
  `{summary.hasColorLevelActuals ? (c.actualFabric > 0 ? formatNum(c.actualFabric) : 'لم يتم الإدخال') : (summary.totalActualFabric > 0 ? 'غير متاح حسب اللون' : 'لم يتم الإدخال')}`
);

fs.writeFileSync('src/components/FabricSummary.tsx', code);
