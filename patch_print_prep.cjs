const fs = require('fs');
let content = fs.readFileSync('src/components/PrintPrepSheet.tsx', 'utf8');

if (!content.includes('getMaterials')) {
  content = content.replace(
    /import \{ getOrderById \} from "\.\.\/lib\/storage";/,
    "import { getOrderById } from \"../lib/storage\";\nimport { getMaterials } from \"../lib/accountingStorage\";\nimport { MaterialItem } from \"../types\";"
  );
}

content = content.replace(
  /export function PrintPrepSheet\(\{([^}]*)\}: PrintPrepSheetProps\) \{/,
  `export function PrintPrepSheet({$1}: PrintPrepSheetProps) {
  const [accessories, setAccessories] = React.useState<MaterialItem[]>([]);
  React.useEffect(() => {
    setAccessories(getMaterials().filter(m => m.type === 'accessory' && m.isActive));
  }, []);`
);

const newFunction = `
  const handleUpdateActualAccessory = async (batchId: string, accessoryName: string, actualName: string) => {
    const updatedBatches = order?.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map((a) =>
            a.accessoryName === accessoryName
              ? { ...a, actualAccessoryName: actualName }
              : a,
          ),
        };
      }
      return b;
    });
    const result = await Cmd.savePrepData(order, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };
`;

content = content.replace(/const handleToggleAllAccessories = async/, newFunction + '\n  const handleToggleAllAccessories = async');

// Now, update the table header to include "الإكسسوار الفعلي"
content = content.replace(
  /<th className="border border-slate-200 p-2 font-medium">\s*الإكسسوار\s*<\/th>/,
  '<th className="border border-slate-200 p-2 font-medium">الإكسسوار (المطلوب)</th>\n                              <th className="border border-slate-200 p-2 font-medium text-center">الإكسسوار الفعلي (المنصرف)</th>'
);

// Update table rows
content = content.replace(
  /<td className="border border-slate-200 p-2 font-medium">\s*\{acc.accessoryName\}\s*<\/td>/,
  `<td className="border border-slate-200 p-2 font-medium">
                                      {acc.accessoryName}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center align-middle w-48">
                                      <select
                                        value={acc.actualAccessoryName || ''}
                                        disabled={batch.prepStatus === "مكتمل"}
                                        onChange={(e) => handleUpdateActualAccessory(batch.id, acc.accessoryName, e.target.value)}
                                        className={\`w-full px-2 py-1 border rounded text-xs \${batch.prepStatus === "مكتمل" ? "bg-slate-100" : "bg-white"}\`}
                                      >
                                        <option value="">نفس الإكسسوار</option>
                                        {accessories.map(a => (
                                          <option key={a.id} value={a.name}>{a.name}</option>
                                        ))}
                                      </select>
                                    </td>`
);

fs.writeFileSync('src/components/PrintPrepSheet.tsx', content);
