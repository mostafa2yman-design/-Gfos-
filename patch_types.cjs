const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const replacement = `export interface LaborProfile {
  id: string;
  name: string;
  role: string;
  phone?: string;
  baseSalary?: number;
  isActive: boolean;
  linkedAccountId?: string;
  operationalGroupId?: string;
  salaryType?: 'يومية' | 'بالقطعة';
  salaryPeriod?: 'يومي' | 'أسبوعي' | 'شهري';
  dailyWorkingHours?: number;
}`;

content = content.replace(/export interface LaborProfile\s*\{[^}]+\}/, replacement);
fs.writeFileSync('src/types.ts', content);
