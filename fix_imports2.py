import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { CopyBomModal } from "./CopyBomModal";\nimport {\n  Save,\n  Copy,', 'import { CopyBomModal } from "./CopyBomModal";\nimport {\n  Save,\n  Copy,\n  X,')

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)
