const fs = require('fs');
let content = fs.readFileSync('src/components/form/BomSection.tsx', 'utf8');

if (!content.includes('getMaterials')) {
  content = content.replace(
    /import React from 'react';/,
    "import React, { useState, useEffect } from 'react';\nimport { getMaterials } from '../../lib/accountingStorage';\nimport { MaterialItem } from '../../types';"
  );
}

content = content.replace(
  /export function BomSection\(\{([^}]*)\}: BomSectionProps\) \{/,
  `export function BomSection({$1}: BomSectionProps) {
  const [availableFabrics, setAvailableFabrics] = useState<MaterialItem[]>([]);
  const [availableAccessories, setAvailableAccessories] = useState<MaterialItem[]>([]);
  
  useEffect(() => {
    const allMaterials = getMaterials();
    setAvailableFabrics(allMaterials.filter(m => m.type === 'fabric' && m.isActive));
    setAvailableAccessories(allMaterials.filter(m => m.type === 'accessory' && m.isActive));
  }, []);`
);

const materialNameRegex = /<input\s+type="text"\s+value=\{mat\.name\}\s+onChange=\{\(e\) => handleUpdateMaterial\(idx,\s+'name',\s+e\.target\.value\)\}\s+disabled=\{readOnly\}\s+placeholder="اسم الخامة"\s+className=\{`([^`]+)`\}\s*\/>/;

const newMaterialNameInput = `
                    <select
                      value={mat.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = availableFabrics.find(f => f.name === val);
                        handleUpdateMaterial(idx, 'name', val);
                        if(found) {
                          handleUpdateMaterial(idx, 'unit', found.unit);
                        }
                      }}
                      disabled={readOnly}
                      className={\`w-full px-2 py-1.5 border rounded \${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}\`}
                    >
                      <option value="">أدخل اسم الخامة / بدون</option>
                      {availableFabrics.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
`;

content = content.replace(materialNameRegex, newMaterialNameInput);

const accNameRegex = /<input\s+type="text"\s+value=\{acc\.name\}\s+onChange=\{\(e\) => handleUpdateAccessory\(idx,\s+'name',\s+e\.target\.value\)\}\s+disabled=\{readOnly\}\s+placeholder="اسم الإكسسوار"\s+className=\{`([^`]+)`\}\s*\/>/;

const newAccNameInput = `
                    <select
                      value={acc.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = availableAccessories.find(a => a.name === val);
                        handleUpdateAccessory(idx, 'name', val);
                        if(found) {
                          handleUpdateAccessory(idx, 'unit', found.unit);
                        }
                      }}
                      disabled={readOnly}
                      className={\`w-full px-2 py-1.5 border rounded \${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}\`}
                    >
                      <option value="">أدخل اسم الإكسسوار / بدون</option>
                      {availableAccessories.map(a => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
`;

content = content.replace(accNameRegex, newAccNameInput);

fs.writeFileSync('src/components/form/BomSection.tsx', content);
