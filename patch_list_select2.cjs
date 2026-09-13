const fs = require('fs');
let content = fs.readFileSync('src/components/ProductionOrdersList.tsx', 'utf8');
if (!content.includes('ChevronDown')) {
   content = content.replace(/import \{ Search, Edit, Eye, Filter, Trash2 \} from 'lucide-react';/, "import { Search, Edit, Eye, Filter, Trash2, ChevronDown } from 'lucide-react';");
   fs.writeFileSync('src/components/ProductionOrdersList.tsx', content);
}
