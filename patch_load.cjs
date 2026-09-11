const fs = require('fs');

// Patch FinishingForm.tsx
let fContent = fs.readFileSync('src/components/FinishingForm.tsx', 'utf8');
fContent = fContent.replace(/actualQuantities: b.sewingData\?\.actualQuantities\?\.map/g, "actualQuantities: (b.sewingData?.actualQuantities || []).map");
fContent = fContent.replace(/batch\.sewingData\?\.actualQuantities\?\.map/g, "(batch.sewingData?.actualQuantities || []).map");
fs.writeFileSync('src/components/FinishingForm.tsx', fContent);

// Patch IroningForm.tsx
let iContent = fs.readFileSync('src/components/IroningForm.tsx', 'utf8');
iContent = iContent.replace(/actualQuantities: b.finishingData\?\.actualQuantities\?\.map/g, "actualQuantities: (b.finishingData?.actualQuantities || []).map");
iContent = iContent.replace(/batch\.finishingData\?\.actualQuantities\?\.map/g, "(batch.finishingData?.actualQuantities || []).map");
fs.writeFileSync('src/components/IroningForm.tsx', iContent);

