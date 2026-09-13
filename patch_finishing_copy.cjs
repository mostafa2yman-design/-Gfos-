const fs = require('fs');
let content = fs.readFileSync('src/components/FinishingForm.tsx', 'utf8');

content = content.replace(
  /actualCostPerPiece: sourceBatch\.finishingData\.actualCostPerPiece/,
  "actualCostPerPiece: sourceBatch.finishingData.actualCostPerPiece,\n          workerName: sourceBatch.finishingData.workerName"
);

fs.writeFileSync('src/components/FinishingForm.tsx', content);
