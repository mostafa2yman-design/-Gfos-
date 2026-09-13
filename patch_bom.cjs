const fs = require('fs');
let content = fs.readFileSync('src/components/form/BomSection.tsx', 'utf8');

// Add handleSelectMaterial and handleSelectAccessory
const insertAfter1 = /const handleUpdateMaterial = [^\}]+\}\;\n/g;
// Replace only the first occurrence for material, accessory is slightly further down
content = content.replace(
  /const handleUpdateMaterial = \(index: number, field: keyof MaterialInstance, value: any\) => \{[\s\S]*?onChange\('materials', updated\);\n  \};/,
  `const handleUpdateMaterial = (index: number, field: keyof MaterialInstance, value: any) => {
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
  /const handleUpdateAccessory = \(index: number, field: keyof AccessoryInstance, value: any\) => \{[\s\S]*?onChange\('accessories', updated\);\n  \};/,
  `const handleUpdateAccessory = (index: number, field: keyof AccessoryInstance, value: any) => {
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

// Fix the select tags
content = content.replace(
  /onChange=\{\(e\) => \{\s*const val = e\.target\.value;\s*const found = availableFabrics\.find\(f => f\.name === val\);\s*handleUpdateMaterial\(idx, 'name', val\);\s*if\(found\) \{\s*handleUpdateMaterial\(idx, 'unit', found\.unit\);\s*\}\s*\}\}/g,
  `onChange={(e) => {
                        const val = e.target.value;
                        const found = availableFabrics.find(f => f.name === val);
                        if (found) {
                          handleSelectMaterial(idx, val, found.unit, found.defaultCost || 0);
                        } else {
                          handleUpdateMaterial(idx, 'name', val);
                        }
                      }}`
);

content = content.replace(
  /onChange=\{\(e\) => \{\s*const val = e\.target\.value;\s*const found = availableAccessories\.find\(a => a\.name === val\);\s*handleUpdateAccessory\(idx, 'name', val\);\s*if\(found\) \{\s*handleUpdateAccessory\(idx, 'unit', found\.unit\);\s*\}\s*\}\}/g,
  `onChange={(e) => {
                        const val = e.target.value;
                        const found = availableAccessories.find(a => a.name === val);
                        if (found) {
                          handleSelectAccessory(idx, val, found.unit, found.defaultCost || 0);
                        } else {
                          handleUpdateAccessory(idx, 'name', val);
                        }
                      }}`
);

fs.writeFileSync('src/components/form/BomSection.tsx', content);
