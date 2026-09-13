const fs = require('fs');
let content = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

if (!content.includes('getLabor')) {
  content = content.replace(
    /import \{ getOrderById \} from "\.\.\/lib\/storage";/,
    "import { getOrderById } from \"../lib/storage\";\nimport { getLabor, getMaterials } from \"../lib/accountingStorage\";\nimport { LaborProfile, MaterialItem } from \"../types\";"
  );
}

content = content.replace(
  /export function CutOrderForm\(\{([^}]*)\}: CutOrderFormProps\) \{/,
  `export function CutOrderForm({$1}: CutOrderFormProps) {
  const [laborList, setLaborList] = React.useState<LaborProfile[]>([]);
  const [fabrics, setFabrics] = React.useState<MaterialItem[]>([]);
  React.useEffect(() => {
    setLaborList(getLabor().filter(l => l.role === 'عامل قص' && l.isActive));
    setFabrics(getMaterials().filter(m => m.type === 'fabric' && m.isActive));
  }, []);`
);

const newFields = `      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">عامل القص</label>
          <select
            value={cutData.cutterName || ''}
            disabled={isReadOnly}
            onChange={(e) => setCutData(prev => prev ? { ...prev, cutterName: e.target.value } : prev)}
            className={\`w-full px-3 py-2 border rounded-lg appearance-none \${isReadOnly ? 'bg-slate-100 text-slate-600' : 'bg-white focus:ring-2 focus:ring-indigo-500'}\`}
          >
            <option value="">اختر عامل القص...</option>
            {laborList.map(l => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">الخامة المستخدمة فعلياً</label>
          <select
            value={cutData.actualFabricName || ''}
            disabled={isReadOnly}
            onChange={(e) => setCutData(prev => prev ? { ...prev, actualFabricName: e.target.value } : prev)}
            className={\`w-full px-3 py-2 border rounded-lg appearance-none \${isReadOnly ? 'bg-slate-100 text-slate-600' : 'bg-white focus:ring-2 focus:ring-indigo-500'}\`}
          >
            <option value="">اختر الخامة...</option>
            {fabrics.map(f => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;

content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/, newFields);

fs.writeFileSync('src/components/CutOrderForm.tsx', content);
