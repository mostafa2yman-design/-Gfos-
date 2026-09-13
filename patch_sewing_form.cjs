const fs = require('fs');
let content = fs.readFileSync('src/components/SewingForm.tsx', 'utf8');

if (!content.includes('getOperationalGroups')) {
  content = content.replace(
    /import \{ getOrderById \} from "\.\.\/lib\/storage";/,
    "import { getOrderById } from \"../lib/storage\";\nimport { getOperationalGroups } from \"../lib/accountingStorage\";\nimport { OperationalGroup } from \"../types\";"
  );
}

content = content.replace(
  /export const SewingForm: React\.FC<Props> = \(\{([^}]*)\}\) => \{/,
  `export const SewingForm: React.FC<Props> = ({$1}) => {
  const [internalGroups, setInternalGroups] = useState<OperationalGroup[]>([]);
  const [externalGroups, setExternalGroups] = useState<OperationalGroup[]>([]);
  
  useEffect(() => {
    const allGroups = getOperationalGroups();
    setInternalGroups(allGroups.filter(g => g.type === 'internal' && g.isActive));
    setExternalGroups(allGroups.filter(g => g.type === 'external' && g.isActive));
  }, []);`
);

// Replace sewingGroup input with select
const sewingGroupInputRegex = /<input\s+type="text"\s+value=\{sData\.sewingGroup \|\| ""\}\s+onChange=\{\(e\) => handleSewingChange\(batch\.id, "sewingGroup", e\.target\.value\)\}\s+disabled=\{isReadOnly \|\| sData\.status === 'مكتمل'\}\s+className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"\s+placeholder="أدخل اسم\/رقم المجموعة"\s*\/>/;

const newSewingGroupInput = `
                      <select
                        value={sData.sewingGroup || ""}
                        onChange={(e) => handleSewingChange(batch.id, "sewingGroup", e.target.value)}
                        disabled={isReadOnly || sData.status === 'مكتمل'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="" disabled>اختر المجموعة...</option>
                        {internalGroups.map(g => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>
`;

content = content.replace(sewingGroupInputRegex, newSewingGroupInput);

// Replace externalManufacturer input with select
const externalManInputRegex = /<input\s+type="text"\s+value=\{sData\.externalManufacturer \|\| ""\}\s+onChange=\{\(e\) => handleSewingChange\(batch\.id, "externalManufacturer", e\.target\.value\)\}\s+disabled=\{isReadOnly \|\| sData\.status === 'مكتمل'\}\s+className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"\s+placeholder="أدخل اسم الجهة الخارجية"\s*\/>/;

const newExternalManInput = `
                      <select
                        value={sData.externalManufacturer || ""}
                        onChange={(e) => handleSewingChange(batch.id, "externalManufacturer", e.target.value)}
                        disabled={isReadOnly || sData.status === 'مكتمل'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="" disabled>اختر الجهة الخارجية...</option>
                        {externalGroups.map(g => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>
`;

content = content.replace(externalManInputRegex, newExternalManInput);

fs.writeFileSync('src/components/SewingForm.tsx', content);
