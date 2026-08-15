import re

with open('src/components/form/SizeCard.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace("import { SizeData, PREDEFINED_COLORS, Variant } from '../../types';", "import { SizeData, Variant } from '../../types';\nimport { getAvailableColors } from '../../lib/colors';")

# Replace PREDEFINED_COLORS with getAvailableColors()
content = content.replace("const availableColors = PREDEFINED_COLORS.filter", "const allAvailable = getAvailableColors();\n  const availableColors = allAvailable.filter")

# Also change key={variant.color || idx} to key={idx}
content = content.replace("key={variant.color || idx}", "key={idx}")

with open('src/components/form/SizeCard.tsx', 'w') as f:
    f.write(content)
print("Done")
