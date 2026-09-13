const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(/costAnalysis\.isStandardComplete \? Number\(costAnalysis\.totalStandardCostPerPiece\)\.toFixed\(2\) : <span className="text-amber-500 text-xs">غير مكتمل<\/span>/, 'Number(costAnalysis.totalStandardPerPiece).toFixed(2)');
content = content.replace(/costAnalysis\.isActualComplete \? Number\(costAnalysis\.totalActualCostPerPiece\)\.toFixed\(2\) : <span className="text-amber-500 text-xs">غير مكتمل<\/span>/, 'costAnalysis.isActualComplete ? Number(costAnalysis.totalActualPerPiece).toFixed(2) : <span className="text-amber-500 text-xs">غير مكتمل</span>');

fs.writeFileSync('src/components/Dashboard.tsx', content);

