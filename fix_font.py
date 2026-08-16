with open('index.html', 'r') as f:
    content = f.read()

import re
content = content.replace('family=Tajawal:wght@300;400;500;700;800', 'family=Tajawal:wght@300;400;500;700;800&family=Cairo:wght@400;600;700')

with open('index.html', 'w') as f:
    f.write(content)

