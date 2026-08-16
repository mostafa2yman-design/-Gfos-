import re
with open('src/components/CutOrderForm.tsx', 'r') as f:
    content = f.read()

# Replace button text
content = content.replace('طباعة أمر التشغيل', 'طباعة أمر القص')

with open('src/components/CutOrderForm.tsx', 'w') as f:
    f.write(content)
