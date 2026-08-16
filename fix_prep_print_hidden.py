import re

with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

# I need to wrap the whole component in <div className="relative"> and add print:hidden to the main div
content = content.replace('    <>\n      {confirmConfig && (', '    <div className="relative">\n      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>\n      {confirmConfig && (')

content = content.replace('        </div>\n      </div>\n      {printingBatchId && (', '        </div>\n      </div>\n      </div>\n      {printingBatchId && (')

content = content.replace('      )}\n    </>\n  );\n}', '      )}\n    </div>\n  );\n}')


with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)

print("Done hiding prep sheet UI")
