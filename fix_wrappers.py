import re

files = ['src/components/PrintEmbroideryForm.tsx', 'src/components/CutOrderForm.tsx', 'src/components/PrintPrepSheet.tsx']

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Replace start
    content = content.replace('return (\n    <div className="relative">', 'return (\n    <>')
    content = content.replace('return (\n    <div className="relative">\n', 'return (\n    <>\n')

    # Replace end
    content = content.replace('      )}\n    </div>\n  );\n}', '      )}\n    </>\n  );\n}')
    content = content.replace('      )}\n    </div>\n  );\n};', '      )}\n    </>\n  );\n};')

    with open(file, 'w') as f:
        f.write(content)

print("Wrappers fixed")
