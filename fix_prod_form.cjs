const fs = require('fs');
let code = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

// Add imports
code = code.replace(
  `import { BomSection } from "./form/BomSection";`,
  `import { BomSection } from "./form/BomSection";\nimport { calculateFabricAnalysis } from "../lib/fabricUtils";\nimport { FabricSummary } from "./FabricSummary";`
);

// Calculate summary
const renderIndex = code.indexOf(`return (`);
const calcCode = `
  const fabricSummary = calculateFabricAnalysis(order, order.cutData);
`;
code = code.slice(0, renderIndex) + calcCode + code.slice(renderIndex);

// Inject component
const bomIndex = code.indexOf(`</BomSection>`) !== -1 ? code.indexOf(`</BomSection>`) + `</BomSection>`.length : code.indexOf(`/>`, code.indexOf(`<BomSection`)) + `/>`.length;
const injectCode = `
          {fabricSummary && (
            <div className="mt-8">
              <FabricSummary summary={fabricSummary} />
            </div>
          )}
`;
code = code.slice(0, bomIndex) + injectCode + code.slice(bomIndex);

fs.writeFileSync('src/components/ProductionOrderForm.tsx', code);
