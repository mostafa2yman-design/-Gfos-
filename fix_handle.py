import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

replacement = """  const handleBasicInfoChange = (
    field: keyof ProductionOrder,
    value: string,
  ) => {
    if (isReadOnly) return;
    setOrder((prev) => {
      let finalValue: any = value;
      if (field === 'printEmbroideryStandardCost' || field === 'standardSewingCostPerPiece') {
        finalValue = value === '' ? undefined : parseFloat(value);
      }
      const next = { ...prev, [field]: finalValue };

      // Auto-load BOM if styleName changes and matches a template
"""

content = re.sub(r'  const handleBasicInfoChange = \(\n    field: keyof ProductionOrder,\n    value: string,\n  \) => \{\n    if \(isReadOnly\) return;\n    setOrder\(\(prev\) => \{\n      const next = \{ \.\.\.prev, \[field\]: value \};\n\n      // Auto-load BOM if styleName changes and matches a template\n', replacement, content)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)

