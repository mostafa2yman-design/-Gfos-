import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

# I will increase the max-h-80 to max-h-[30rem] which is 480px, or just remove max-h
content = content.replace("max-h-80", "max-h-[500px]")

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)

print("Done")
