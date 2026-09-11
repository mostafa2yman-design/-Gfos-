const fs = require('fs');
let content = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

const buggy = `  const handleWeightChange = async (color: string, value: number) => {

  const handleActualCostChange = (value: number | undefined) => {
    if (isReadOnly) return;
    setCutData((prev) => prev ? { ...prev, actualCostPerPiece: value } : prev);
  };

    if (isReadOnly) return;
    setCutData((prev) => {`;

const fixed = `  const handleActualCostChange = (value: number | undefined) => {
    if (isReadOnly) return;
    setCutData((prev) => prev ? { ...prev, actualCostPerPiece: value } : prev);
  };

  const handleWeightChange = async (color: string, value: number) => {
    if (isReadOnly) return;
    setCutData((prev) => {`;

content = content.replace(buggy, fixed);
fs.writeFileSync('src/components/CutOrderForm.tsx', content);
