const fs = require('fs');
let content = fs.readFileSync('src/components/form/BomSection.tsx', 'utf8');

// Find and insert
content = content.replace(
  /const handleUpdateMaterial = \(index: number, field: keyof MaterialInstance, value: string \| number \| \{ size: string; standard: number \}?\[\]\) => \{\s*if \(readOnly\) return;\s*const updated = \[\.\.\.materials\];\s*updated\[index\] = \{ \.\.\.updated\[index\], \[field\]: value \};\s*onChange\('materials', updated\);\s*\};/,
  `const handleUpdateMaterial = (index: number, field: keyof MaterialInstance, value: string | number | { size: string; standard: number }[]) => {
    if (readOnly) return;
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    onChange('materials', updated);
  };

  const handleSelectMaterial = (index: number, name: string, unit: string, defaultCost: number) => {
    if (readOnly) return;
    const updated = [...materials];
    updated[index] = { ...updated[index], name, unit, standardPrice: defaultCost || 0 };
    onChange('materials', updated);
  };`
);

content = content.replace(
  /const handleUpdateAccessory = \(index: number, field: keyof AccessoryInstance, value: string \| number \| \{ size: string; standard: number \}?\[\]\) => \{\s*if \(readOnly\) return;\s*const updated = \[\.\.\.accessories\];\s*updated\[index\] = \{ \.\.\.updated\[index\], \[field\]: value \};\s*onChange\('accessories', updated\);\s*\};/,
  `const handleUpdateAccessory = (index: number, field: keyof AccessoryInstance, value: string | number | { size: string; standard: number }[]) => {
    if (readOnly) return;
    const updated = [...accessories];
    updated[index] = { ...updated[index], [field]: value };
    onChange('accessories', updated);
  };

  const handleSelectAccessory = (index: number, name: string, unit: string, defaultCost: number) => {
    if (readOnly) return;
    const updated = [...accessories];
    updated[index] = { ...updated[index], name, unit, standardPrice: defaultCost || 0 };
    onChange('accessories', updated);
  };`
);

fs.writeFileSync('src/components/form/BomSection.tsx', content);
