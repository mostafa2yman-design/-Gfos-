const fs = require('fs');

let fPrint = fs.readFileSync('src/components/print/workorders/FinishingWorkOrderPrint.tsx', 'utf8');
fPrint = fPrint.replace(/rowSpan=\{batch\.sewingData!\.actualQuantities\.length\}/g, "rowSpan={batch.sewingData!.actualQuantities?.length || 1}");
fPrint = fPrint.replace(/batch\.sewingData\.actualQuantities\.map/g, "(batch.sewingData.actualQuantities || []).map");
fs.writeFileSync('src/components/print/workorders/FinishingWorkOrderPrint.tsx', fPrint);

let iPrint = fs.readFileSync('src/components/print/workorders/IroningWorkOrderPrint.tsx', 'utf8');
iPrint = iPrint.replace(/rowSpan=\{batch\.finishingData!\.actualQuantities\.length\}/g, "rowSpan={batch.finishingData!.actualQuantities?.length || 1}");
iPrint = iPrint.replace(/batch\.finishingData\.actualQuantities\.map/g, "(batch.finishingData.actualQuantities || []).map");
fs.writeFileSync('src/components/print/workorders/IroningWorkOrderPrint.tsx', iPrint);
