import re
with open('src/components/CutOrderForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('      <div className="space-y-6 print:hidden">', '      <div className={`space-y-6 print:hidden ${isPrinting ? "hidden" : ""}`}>')

content = content.replace('      {isPrinting && (\n        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50">', '      {isPrinting && (\n        <div className="hidden print:block print:absolute print:inset-0">')

with open('src/components/CutOrderForm.tsx', 'w') as f:
    f.write(content)
