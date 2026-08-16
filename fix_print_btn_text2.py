import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('طباعة أمر التشغيل', 'طباعة أمر الطباعة')

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
