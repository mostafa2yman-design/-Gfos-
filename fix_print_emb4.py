import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

bad_end = """        </div>
      </div>
      {printingBatchId && ("""

good_end = """        </div>
      </div>
      </div>
      {printingBatchId && ("""

content = content.replace(bad_end, good_end)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
