import { AccountNode, CustomerSupplier, MaterialItem, LaborProfile, OperationalGroup, Department } from '../types';

const ACCOUNTS_KEY = 'accounting_accounts_v1';
const CUSTOMERS_KEY = 'accounting_customers_v1';
const MATERIALS_KEY = 'accounting_materials_v1';
const LABOR_KEY = 'accounting_labor_v1';
const GROUPS_KEY = 'accounting_groups_v1';
const DEPARTMENTS_KEY = 'accounting_departments_v1';

// Generic CRUD functions for localStorage
function getItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return [];
  }
}

function saveItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export const getAccounts = () => getItems<AccountNode>(ACCOUNTS_KEY);
export const saveAccounts = (items: AccountNode[]) => saveItems(ACCOUNTS_KEY, items);

export const getCustomersSuppliers = () => getItems<CustomerSupplier>(CUSTOMERS_KEY);
export const saveCustomersSuppliers = (items: CustomerSupplier[]) => saveItems(CUSTOMERS_KEY, items);

export const getMaterials = () => getItems<MaterialItem>(MATERIALS_KEY);
export const saveMaterials = (items: MaterialItem[]) => saveItems(MATERIALS_KEY, items);

export const getLabor = () => getItems<LaborProfile>(LABOR_KEY);
export const saveLabor = (items: LaborProfile[]) => saveItems(LABOR_KEY, items);

export const getOperationalGroups = () => getItems<OperationalGroup>(GROUPS_KEY);
export const saveOperationalGroups = (items: OperationalGroup[]) => saveItems(GROUPS_KEY, items);


export const getDepartments = () => {
  const depts = getItems<Department>(DEPARTMENTS_KEY);
  if (depts.length === 0) {
    // Default departments
    const defaults: Department[] = [
      { id: 'dept_cut', name: 'عامل قص', createdAt: new Date().toISOString() },
      { id: 'dept_prep', name: 'عامل تجهيز', createdAt: new Date().toISOString() },
      { id: 'dept_sew', name: 'عامل خياطة', createdAt: new Date().toISOString() },
      { id: 'dept_finish', name: 'عامل تشطيب', createdAt: new Date().toISOString() },
      { id: 'dept_iron', name: 'عامل مكواة', createdAt: new Date().toISOString() },
      { id: 'dept_pack', name: 'عامل تعبئة', createdAt: new Date().toISOString() },
      { id: 'dept_supervisor', name: 'مشرف', createdAt: new Date().toISOString() },
      { id: 'dept_other', name: 'أخرى', createdAt: new Date().toISOString() }
    ];
    saveItems(DEPARTMENTS_KEY, defaults);
    return defaults;
  }
  return depts;
};
export const saveDepartments = (items: Department[]) => saveItems(DEPARTMENTS_KEY, items);
