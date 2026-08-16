import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

bad_markup = """        </div>
        <div className="relative">
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
          {batches.map((batch) => {"""

good_markup = """        </div>
        <div className="space-y-6">
          {batches.map((batch) => {"""

content = content.replace(bad_markup, good_markup)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
