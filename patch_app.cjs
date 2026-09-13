const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
content = content.replace(
  /import \{ Settings \} from "\.\/components\/Settings";/,
  'import { Settings } from "./components/Settings";\nimport { ConfigurationDashboard } from "./components/accounting/ConfigurationDashboard";'
);

// Update ViewState type
content = content.replace(
  /type ViewState = "dashboard" \| "list" \| "form" \| "settings";/,
  'type ViewState = "dashboard" | "list" | "form" | "settings" | "accounting_config";'
);

// Add the rendering logic for the new view
content = content.replace(
  /\{currentView === "settings" && <Settings onBack=\{handleBackToList\} \/>\}/,
  '{currentView === "settings" && <Settings onBack={handleBackToList} />}\n      {currentView === "accounting_config" && <ConfigurationDashboard />}'
);

fs.writeFileSync('src/App.tsx', content);
