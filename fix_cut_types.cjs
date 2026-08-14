const fs = require('fs');
let code = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

code = code.replace(
  `(acc, curr) => acc + (curr || 0)`,
  `(acc: number, curr: number) => acc + (curr || 0)`
);

code = code.replace(
  `{colors.map((color) => (`,
  `{colors.map((color: string) => (`
);

fs.writeFileSync('src/components/CutOrderForm.tsx', code);
