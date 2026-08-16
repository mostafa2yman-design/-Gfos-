with open('src/index.css', 'r') as f:
    content = f.read()

import re
# Ensure Cairo is set for print document explicitly
content = content.replace('.gfos-print-document {', '.gfos-print-document {\n    font-family: "Cairo", sans-serif;')

with open('src/index.css', 'w') as f:
    f.write(content)

