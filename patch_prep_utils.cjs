const fs = require('fs');
let content = fs.readFileSync('src/lib/prepUtils.ts', 'utf8');

content = content.replace(
  /export interface AccessoryPrepCalculation \{/,
  "export interface AccessoryPrepCalculation {\n  actualAccessoryName?: string;"
);

content = content.replace(
  /const prepRecord = batch\.accessoriesPrep\?\.find\(p => p\.accessoryName === acc\.name\);/,
  "const prepRecord = batch.accessoriesPrep?.find(p => p.accessoryName === acc.name || p.accessoryId === acc.id);"
);

content = content.replace(
  /isPrepared: prepRecord\?\.isPrepared \|\| false,/,
  "isPrepared: prepRecord?.isPrepared || false,\n      actualAccessoryName: prepRecord?.actualAccessoryName || '',"
);

fs.writeFileSync('src/lib/prepUtils.ts', content);
