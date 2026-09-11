const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(/"w-4 h-4 \$\{getPrimaryText\(color\)\}"/g, '{\`w-4 h-4 \${getPrimaryText(color)}\`}');

fs.writeFileSync('src/components/Layout.tsx', content);
