const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Remove Calculator from contexts
content = content.replace(/import \{ Calculator, useTheme \} from "\.\.\/contexts\/ThemeContext";/, 'import { useTheme } from "../contexts/ThemeContext";');

// Add Calculator to lucide-react
content = content.replace(/import \{\n  Factory,/, 'import {\n  Calculator,\n  Factory,');

// Fix LayoutProps onNavigate signature
content = content.replace(/onNavigate: \(view: "dashboard" \| "list" \| "form" \| "settings"\) => void;/, 'onNavigate: (view: "dashboard" | "list" | "form" | "settings" | "accounting_config") => void;');

fs.writeFileSync('src/components/Layout.tsx', content);
