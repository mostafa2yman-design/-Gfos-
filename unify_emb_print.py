import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('      {printingBatchId && (\n        <div className="absolute top-0 left-0 w-full z-50 bg-white">', '      {printingBatchId && (\n        <div className="hidden print:block print:absolute print:inset-0">')

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
