const fs = require('fs');

let code = fs.readFileSync('src/lib/fabricUtils.ts', 'utf8');

const newFieldsForColor = `
  standardCostPerPiece: number;
  actualCostPerPiece: number | null;
  costVariance: number | null;
  costVariancePercentage: number | null;
`;

code = code.replace(
  `  variancePercentage: number | null;\n}`,
  `  variancePercentage: number | null;${newFieldsForColor}}`
);

const newFieldsForSummary = `
  fabricPrice: number;
  averageStandardCostPerPiece: number;
  averageActualCostPerPiece: number | null;
  totalCostVariance: number | null;
  totalCostVariancePercentage: number | null;
`;

code = code.replace(
  `  pieceWeightVariancePercentage: number | null;\n}`,
  `  pieceWeightVariancePercentage: number | null;${newFieldsForSummary}}`
);

// We need to inject the logic into calculateFabricAnalysis
// Before: const totalVariancePercentage = ...
// We can insert at the end. But wait, the color loop needs to be updated.
