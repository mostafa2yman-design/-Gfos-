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

# And fix the ending divs
bad_end = """        </div>
      </div>
      </div>
      {printingBatchId && ("""

good_end = """        </div>
      {printingBatchId && ("""

content = content.replace(bad_end, good_end)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
