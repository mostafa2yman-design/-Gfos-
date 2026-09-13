const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('workerName?: string; // for finishing')) {
  content = content.replace(
    /export interface FinishingData \{/,
    "export interface FinishingData {\n  workerName?: string; // for finishing"
  );
}

if (!content.includes('workerName?: string; // for ironing')) {
  content = content.replace(
    /export interface IroningData \{/,
    "export interface IroningData {\n  workerName?: string; // for ironing"
  );
}

fs.writeFileSync('src/types.ts', content);
