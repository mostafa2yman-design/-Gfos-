const fs = require('fs');
let content = fs.readFileSync('src/components/accounting/LaborList.tsx', 'utf8');

// Add getOperationalGroups import
content = content.replace(
  "import { getLabor, saveLabor } from '../../lib/accountingStorage';",
  "import { getLabor, saveLabor, getOperationalGroups } from '../../lib/accountingStorage';\nimport { OperationalGroup } from '../../types';"
);

// Add state for groups
content = content.replace(
  "const [items, setItems] = useState<LaborProfile[]>([]);",
  "const [items, setItems] = useState<LaborProfile[]>([]);\n  const [groups, setGroups] = useState<OperationalGroup[]>([]);"
);

// Load groups
content = content.replace(
  "setItems(getLabor());",
  "setItems(getLabor());\n    setGroups(getOperationalGroups());"
);

// Update initial form data
content = content.replace(
  "role: 'عامل خياطة', phone: '', baseSalary: 0, isActive: true",
  "role: 'عامل خياطة', phone: '', baseSalary: 0, isActive: true, salaryType: 'يومية', salaryPeriod: 'يومي', dailyWorkingHours: 8"
);

// Update table headers
const oldHeaders = `<th className="p-3 font-semibold">الاسم</th>
              <th className="p-3 font-semibold">الدور / التخصص</th>
              <th className="p-3 font-semibold">رقم الهاتف</th>
              <th className="p-3 font-semibold">الراتب الأساسي</th>
              <th className="p-3 font-semibold">الحالة</th>`;

const newHeaders = `<th className="p-3 font-semibold">الاسم</th>
              <th className="p-3 font-semibold">القسم</th>
              <th className="p-3 font-semibold">المجموعة</th>
              <th className="p-3 font-semibold">رقم الهاتف</th>
              <th className="p-3 font-semibold">نوع الراتب</th>
              <th className="p-3 font-semibold">الدورية</th>
              <th className="p-3 font-semibold">الساعات</th>
              <th className="p-3 font-semibold">القيمة</th>
              <th className="p-3 font-semibold">الحالة</th>`;

content = content.replace(oldHeaders, newHeaders);

// Update table rows
const oldCols = `<td className="p-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-slate-400" />
                    {item.name}
                  </div>
                </td>
                <td className="p-3 text-slate-600">{item.role}</td>
                <td className="p-3 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{item.phone || '-'}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600">{item.baseSalary} جنيه</td>
                <td className="p-3">
                  <span className={\`px-2 py-1 rounded text-xs font-medium \${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}\`}>
                    {item.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </td>`;

const newCols = `<td className="p-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-slate-400" />
                    {item.name}
                  </div>
                </td>
                <td className="p-3 text-slate-600">{item.role}</td>
                <td className="p-3 text-slate-600">{groups.find(g => g.id === item.operationalGroupId)?.name || '-'}</td>
                <td className="p-3 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{item.phone || '-'}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600">{item.salaryType || 'يومية'}</td>
                <td className="p-3 text-slate-600">{item.salaryPeriod || 'يومي'}</td>
                <td className="p-3 text-slate-600">{item.dailyWorkingHours || '-'}</td>
                <td className="p-3 font-medium text-indigo-700">{item.baseSalary} جنيه</td>
                <td className="p-3">
                  <span className={\`px-2 py-1 rounded text-xs font-medium \${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}\`}>
                    {item.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </td>`;

content = content.replace(oldCols, newCols);
content = content.replace('<td colSpan={6}', '<td colSpan={10}');


// Update the modal form
const oldForm = `<div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الدور / التخصص</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="عامل قص">عامل قص</option>
                  <option value="عامل خياطة">عامل خياطة</option>
                  <option value="عامل مكواة">عامل مكواة</option>
                  <option value="عامل تعبئة">عامل تعبئة</option>
                  <option value="مشرف">مشرف</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الراتب الأساسي / اليومية</label>
                <input 
                  type="number" 
                  value={formData.baseSalary || 0} 
                  onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">عامل نشط</label>
              </div>`;

const newForm = `<div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">القسم</label>
                  <select 
                    value={formData.role || ''} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="عامل قص">عامل قص</option>
                    <option value="عامل تجهيز">عامل تجهيز</option>
                    <option value="عامل خياطة">عامل خياطة</option>
                    <option value="عامل تشطيب">عامل تشطيب</option>
                    <option value="عامل تجهيز وتشطيب">عامل تجهيز وتشطيب</option>
                    <option value="عامل مكواة">عامل مكواة</option>
                    <option value="عامل تشطيب ومكواة">عامل تشطيب ومكواة</option>
                    <option value="عامل تعبئة">عامل تعبئة</option>
                    <option value="مشرف">مشرف</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المجموعة التابع لها</label>
                <select 
                  value={formData.operationalGroupId || ''} 
                  onChange={e => setFormData({...formData, operationalGroupId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">بدون مجموعة</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الراتب</label>
                  <select 
                    value={formData.salaryType || 'يومية'} 
                    onChange={e => setFormData({...formData, salaryType: e.target.value as 'يومية' | 'بالقطعة'})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="يومية">يومية</option>
                    <option value="بالقطعة">بالقطعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">دورية الراتب</label>
                  <select 
                    value={formData.salaryPeriod || 'يومي'} 
                    onChange={e => setFormData({...formData, salaryPeriod: e.target.value as 'يومي' | 'أسبوعي' | 'شهري'})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="يومي">يومي</option>
                    <option value="أسبوعي">أسبوعي</option>
                    <option value="شهري">شهري</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ساعات العمل اليومية</label>
                  <input 
                    type="number" 
                    value={formData.dailyWorkingHours || 8} 
                    onChange={e => setFormData({...formData, dailyWorkingHours: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">قيمة الراتب</label>
                  <input 
                    type="number" 
                    value={formData.baseSalary || 0} 
                    onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive !== false} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">عامل نشط</label>
              </div>`;

content = content.replace(oldForm, newForm);
fs.writeFileSync('src/components/accounting/LaborList.tsx', content);
