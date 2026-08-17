import re
with open('src/components/SewingForm.tsx', 'r') as f:
    content = f.read()

# I will replace `disabled={isReadOnly}` with `disabled={isReadOnly || sData.status === 'مكتمل'}` in SewingForm.tsx
content = content.replace('disabled={isReadOnly}', 'disabled={isReadOnly || sData.status === \'مكتمل\'}')

with open('src/components/SewingForm.tsx', 'w') as f:
    f.write(content)
