import re
with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

# Replace the absolute wrapper with hidden print:block print:absolute print:inset-0
content = content.replace('      {printingBatchId && (\n        <div className="absolute top-0 left-0 w-full z-50 bg-white">', '      {printingBatchId && (\n        <div className="hidden print:block print:absolute print:inset-0">')

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)
