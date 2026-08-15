import re

with open('src/components/form/SizeCard.tsx', 'r') as f:
    content = f.read()

content = content.replace('{!readOnly && availableColors.length > 0 && (', '{!readOnly && (')

with open('src/components/form/SizeCard.tsx', 'w') as f:
    f.write(content)

print("Done")
