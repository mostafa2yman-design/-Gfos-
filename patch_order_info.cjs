const fs = require('fs');
let content = fs.readFileSync('src/components/form/OrderBasicInfo.tsx', 'utf8');

if (!content.includes('getCustomersSuppliers')) {
  content = content.replace(
    /import React from 'react';/,
    "import React, { useState, useEffect } from 'react';\nimport { getCustomersSuppliers } from '../../lib/accountingStorage';\nimport { CustomerSupplier } from '../../types';"
  );
}

content = content.replace(
  /export function OrderBasicInfo\(\{([^}]*)\}: OrderBasicInfoProps\) \{/,
  `export function OrderBasicInfo({$1}: OrderBasicInfoProps) {
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  useEffect(() => {
    const list = getCustomersSuppliers();
    setCustomers(list.filter(c => c.type === 'customer' || c.type === 'both' && c.isActive));
  }, []);`
);

const customerInputRegex = /<input\s+type="text"\s+value=\{customerName\}\s+disabled=\{readOnly\}\s+onChange=\{\(e\) => onChange\('customerName', e\.target\.value\)\}\s+placeholder="أدخل اسم العميل\.\.\."\s+className=\{`([^`]+)`\}\s*\/>/;

const newCustomerInput = `
              <div className="relative w-full">
                <select
                  value={customerName}
                  disabled={readOnly}
                  onChange={(e) => onChange('customerName', e.target.value)}
                  className={\`w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg transition-shadow appearance-none \${
                    readOnly 
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                      : 'bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }\`}
                >
                  <option value="">أدخل اسم العميل / بدون</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
`;

content = content.replace(customerInputRegex, newCustomerInput);

fs.writeFileSync('src/components/form/OrderBasicInfo.tsx', content);
