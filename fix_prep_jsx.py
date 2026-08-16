import re

with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

# Let's just find the start of the return statement
# It was:
# return (
#   <>
#     {confirmConfig && (
# We changed it to:
# return (
#   <div className="relative">
#     <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
#     {confirmConfig && (

content = content.replace('  return (\n    <div className="relative">\n      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>\n      {confirmConfig && (', '  return (\n    <>\n      <div className="relative">\n        <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>\n      {confirmConfig && (')

content = content.replace('      )}\n    </div>\n  );\n}', '      )}\n        </div>\n      </div>\n    </>\n  );\n}')

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)
