import re

with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('      {printingBatchId && (\n        <PrintEmbroideryWorkOrder', '      {printingBatchId && (\n        <div className="absolute top-0 left-0 w-full z-50 bg-white">\n        <PrintEmbroideryWorkOrder')
content = content.replace('batch={batches.find((b) => b.id === printingBatchId)!} />\n      )}\n    </div>', 'batch={batches.find((b) => b.id === printingBatchId)!} />\n        </div>\n      )}\n    </div>')

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
