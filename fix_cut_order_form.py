import re
with open('src/components/CutOrderForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('<CutWorkOrderPrint order={order} />', '<CutWorkOrderPrint order={order} fabricSummary={fabricSummary} />')

# Let's verify we replaced it.
if '<CutWorkOrderPrint order={order} fabricSummary={fabricSummary} />' not in content:
    print("Not replaced!")
else:
    print("Replaced successfully!")

with open('src/components/CutOrderForm.tsx', 'w') as f:
    f.write(content)
