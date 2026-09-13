const fs = require('fs');
let content = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

// 1. Remove the opening `{fabricSummary && (`
content = content.replace(
  '{fabricSummary && (\n        <div className="mt-8 space-y-6">',
  '<div className="mt-8 space-y-6">'
);

// 2. Change `fabricSummary.colors` to `fabricSummary?.colors`
content = content.replace(
  'const reqFabric = fabricSummary.colors.find((c: any) => c.color === color)?.requiredFabric;',
  'const reqFabric = fabricSummary?.colors?.find((c: any) => c.color === color)?.requiredFabric;'
);

// 3. Update FabricSummary call to conditionally render
content = content.replace(
  '<FabricSummary summary={fabricSummary} />\n        </div>\n      )}',
  '{fabricSummary && <FabricSummary summary={fabricSummary} />}\n        </div>'
);

fs.writeFileSync('src/components/CutOrderForm.tsx', content);
