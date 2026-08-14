const fs = require('fs');
let code = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

// Add imports
code = code.replace(
  `import { Check, Save } from 'lucide-react';`,
  `import { Check, Save } from 'lucide-react';\nimport { calculateFabricAnalysis } from '../lib/fabricUtils';\nimport { FabricSummary } from './FabricSummary';`
);

// Add actualWeightByColor input handler
const handleVariantChangeIndex = code.indexOf(`const handleVariantChange = (sizeIndex: number, variantIndex: number, value: number) => {`);
const handleWeightChangeCode = `
  const handleWeightChange = (color: string, value: number) => {
    if (isReadOnly) return;
    setCutData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actualWeightByColor: {
          ...(prev.actualWeightByColor || {}),
          [color]: value
        }
      };
    });
  };
`;
code = code.slice(0, handleVariantChangeIndex) + handleWeightChangeCode + code.slice(handleVariantChangeIndex);

// Get summary
const totalPlannedIndex = code.indexOf(`let totalPlanned = 0;`);
const summaryCode = `
  const fabricSummary = calculateFabricAnalysis(order, cutData);
  const colors = Array.from(new Set(cutData.sizes.flatMap(s => s.variants.map(v => v.color))));
`;
code = code.slice(0, totalPlannedIndex) + summaryCode + code.slice(totalPlannedIndex);

// Add Actual Weight By Color inputs before the main table, or inside a new section. Let's put it below the Cut Data table.
const endOfTable = code.lastIndexOf(`</div>    </div>    </div>  );`);
const newSection = `
      {fabricSummary && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h4 className="text-md font-bold text-slate-800 mb-4">الوزن الفعلي المسحوب لكل لون (كجم)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colors.map(color => (
                <div key={color}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{color}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={cutData.actualWeightByColor?.[color] || ''}
                    onChange={(e) => handleWeightChange(color, parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className={\`w-full px-3 py-2 border rounded text-sm \${isReadOnly ? 'bg-slate-50 text-slate-700' : 'bg-white focus:ring-2 focus:ring-indigo-500'}\`}
                    placeholder="الوزن الفعلي"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <FabricSummary summary={fabricSummary} />
        </div>
      )}
`;

code = code.slice(0, endOfTable) + newSection + code.slice(endOfTable);

fs.writeFileSync('src/components/CutOrderForm.tsx', code);
