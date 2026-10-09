import { AppUser, UserRole, PermissionKey } from '../types';

export interface PermissionMeta {
  key: PermissionKey;
  label: string;
  category: string;
  description: string;
}

export const ALL_PERMISSIONS_METADATA: PermissionMeta[] = [
  // Dashboard
  { key: 'dashboard.view', label: 'عرض لوحة التحكم والإحصائيات', category: 'لوحة التحكم', description: 'الاطلاع على ملخص الإنتاج ومؤشرات الأداء العامة' },

  // Production Orders
  { key: 'production.view', label: 'عرض أوامر الإنتاج', category: 'أوامر الإنتاج', description: 'الاطلاع على جدول وقائمة أوامر التشغيل والباتشات' },
  { key: 'production.create', label: 'إنشاء أمر إنتاج جديد', category: 'أوامر الإنتاج', description: 'فتح أمر شغل وتحديد الكميات والمقاسات والألوان' },
  { key: 'production.edit', label: 'تعديل أوامر الإنتاج والباتشات', category: 'أوامر الإنتاج', description: 'تعديل بيانات التشغيل ومسارات المراحل والعمالة' },
  { key: 'production.delete', label: 'حذف أوامر الإنتاج', category: 'أوامر الإنتاج', description: 'حذف أمر شغل نهائياً من النظام' },
  { key: 'production.print', label: 'طباعة كروت وتذاكر التشغيل', category: 'أوامر الإنتاج', description: 'طباعة تذكرة التشغيل، كروت الباتش، وأوامر القص' },

  // Stages
  { key: 'stage.cut', label: 'اعتماد وتسجيل مرحلة القص', category: 'مراحل التشغيل', description: 'إدخال أوزان القماش الفعلية واعتماد كارت القص' },
  { key: 'stage.prep', label: 'تجهيز وصرف مستلزمات التشغيل', category: 'مراحل التشغيل', description: 'صرف الإكسسوارات والخيوط والسوست للباتشات' },
  { key: 'stage.sewing', label: 'تسجيل واعتماد مرحلة الخياطة', category: 'مراحل التشغيل', description: 'متابعة خطوط التجميع والخياطة واعتماد الكميات' },
  { key: 'stage.finishing', label: 'تسجيل مرحلة الفنش والكي', category: 'مراحل التشغيل', description: 'متابعة الكي والتشطيب النهائي والمراجعة' },
  { key: 'stage.quality', label: 'فحص ومراقبة الجودة (QC)', category: 'مراحل التشغيل', description: 'تسجيل المعيب والفرز الأول والثاني واعتماد الجودة' },
  { key: 'stage.packing', label: 'التعبئة والتغليف والباركود', category: 'مراحل التشغيل', description: 'توليد أرقام السيريال وطباعة الباركود وتعبئة الكراتين' },

  // Warehouses
  { key: 'warehouse.raw_materials.view', label: 'عرض مخزن الأقمشة والإكسسوارات', category: 'المخازن', description: 'الاطلاع على أرصدة الخامات والأقمشة والمستلزمات' },
  { key: 'warehouse.raw_materials.manage', label: 'إدارة وحركات مخزن الخامات', category: 'المخازن', description: 'تسجيل تسويات جردية وإذن صرف أو إضافة خامات' },
  { key: 'warehouse.finished_goods.view', label: 'عرض مخزن المنتجات التامة', category: 'المخازن', description: 'متابعة بضاعة الفرز الأول والثاني الجاهزة للتسليم' },
  { key: 'warehouse.finished_goods.manage', label: 'إدارة وتسليم المنتجات التامة', category: 'المخازن', description: 'تسجيل تسليمات العملاء وأذون صرف المنتج التام' },

  // Purchases
  { key: 'purchases.view', label: 'عرض فواتير المشتريات والتوريد', category: 'المشتريات', description: 'الاطلاع على فواتير شراء الخامات وحسابات الموردين' },
  { key: 'purchases.create', label: 'تسجيل فواتير شراء جديدة', category: 'المشتريات', description: 'إدخال فواتير توريد الأقمشة والإكسسوارات وتأثيرها المخزني' },
  { key: 'purchases.edit', label: 'تعديل فواتير الشراء', category: 'المشتريات', description: 'تعديل أسعار وبنود فواتير الشراء المسجلة' },
  { key: 'purchases.delete', label: 'حذف فواتير الشراء', category: 'المشتريات', description: 'إلغاء وحذف فواتير الشراء' },

  // Sales
  { key: 'sales.view', label: 'عرض فواتير المبيعات ومسحوبات العملاء', category: 'المبيعات', description: 'الاطلاع على فواتير بيع الملابس والمنتجات التامة والذمم' },
  { key: 'sales.create', label: 'إصدار فواتير بيع جديدة', category: 'المبيعات', description: 'إنشاء فواتير بيع للمنتجات التامة والخصومات والتحصيل' },
  { key: 'sales.edit', label: 'تعديل فواتير البيع', category: 'المبيعات', description: 'تعديل بنود وأسعار فواتير المبيعات' },
  { key: 'sales.delete', label: 'حذف فواتير البيع', category: 'المبيعات', description: 'إلغاء وحذف فواتير المبيعات' },

  // Accounting & Costing
  { key: 'accounting.chart_of_accounts', label: 'إدارة شجرة الحسابات ودليل التكاليف', category: 'الحسابات والتكاليف', description: 'الاطلاع وتعديل شجرة الحسابات الصناعية والإنتاج تحت التشغيل' },
  { key: 'accounting.customers_suppliers', label: 'إدارة دليل العملاء والموردين', category: 'الحسابات والتكاليف', description: 'تسجيل وتعديل بيانات العملاء والموردين' },
  { key: 'accounting.materials_catalog', label: 'إدارة كتالوج الخامات القياسية', category: 'الحسابات والتكاليف', description: 'تحديد الأسعار المعيارية للأقمشة والإكسسوارات' },
  { key: 'accounting.labor_rates', label: 'إدارة مصفوفة أجور العمالة والأقسام', category: 'الحسابات والتكاليف', description: 'تحديد سعر القطعة والدقيقة للمراحل الإنتاجية' },
  { key: 'accounting.view_financials', label: 'الاطلاع على القيم المالية والتكاليف والأرباح', category: 'الحسابات والتكاليف', description: 'رؤية تكاليف الإنتاج، هوامش الربح، والتقارير المالية الحساسة' },

  // Admin & System
  { key: 'admin.users_management', label: 'إدارة المستخدمين والصلاحيات (RBAC)', category: 'إدارة النظام', description: 'إنشاء المستخدمين، تحديد كلمات المرور، وضبط الصلاحيات' },
  { key: 'admin.system_settings', label: 'إعدادات النظام والمظهر', category: 'إدارة النظام', description: 'تخصيص ألوان وتفضيلات النظام والنسخ الاحتياطي' }
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = ALL_PERMISSIONS_METADATA.map(p => p.key);

// Helper to generate full permissions for admin
export function getAdminPermissions(): Record<PermissionKey, boolean> {
  const perm: Partial<Record<PermissionKey, boolean>> = {};
  ALL_PERMISSION_KEYS.forEach(key => {
    perm[key] = true;
  });
  return perm as Record<PermissionKey, boolean>;
}

// Generate permissions by role
export function getDefaultPermissionsForRole(role: UserRole): Record<PermissionKey, boolean> {
  const perm: Record<PermissionKey, boolean> = {} as any;
  ALL_PERMISSION_KEYS.forEach(k => {
    perm[k] = false;
  });

  if (role === 'admin') {
    ALL_PERMISSION_KEYS.forEach(k => {
      perm[k] = true;
    });
    return perm;
  }

  // Base permission for all logged in factory users
  perm['dashboard.view'] = true;
  perm['production.view'] = true;

  if (role === 'production_manager') {
    perm['production.create'] = true;
    perm['production.edit'] = true;
    perm['production.delete'] = true;
    perm['production.print'] = true;
    perm['stage.cut'] = true;
    perm['stage.prep'] = true;
    perm['stage.sewing'] = true;
    perm['stage.finishing'] = true;
    perm['stage.quality'] = true;
    perm['stage.packing'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['warehouse.finished_goods.manage'] = true;
    perm['accounting.customers_suppliers'] = true;
    perm['accounting.materials_catalog'] = true;
    perm['accounting.labor_rates'] = true;
    perm['accounting.view_financials'] = true;
  } else if (role === 'warehouse_keeper') {
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.raw_materials.manage'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['warehouse.finished_goods.manage'] = true;
    perm['stage.prep'] = true;
    perm['purchases.view'] = true;
    perm['purchases.create'] = true;
    perm['production.print'] = true;
  } else if (role === 'quality_supervisor') {
    perm['stage.quality'] = true;
    perm['stage.finishing'] = true;
    perm['stage.packing'] = true;
    perm['production.print'] = true;
  } else if (role === 'accountant') {
    perm['purchases.view'] = true;
    perm['purchases.create'] = true;
    perm['purchases.edit'] = true;
    perm['sales.view'] = true;
    perm['sales.create'] = true;
    perm['sales.edit'] = true;
    perm['accounting.chart_of_accounts'] = true;
    perm['accounting.customers_suppliers'] = true;
    perm['accounting.materials_catalog'] = true;
    perm['accounting.labor_rates'] = true;
    perm['accounting.view_financials'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.finished_goods.view'] = true;
  } else if (role === 'cutter') {
    perm['stage.cut'] = true;
    perm['production.print'] = true;
    perm['warehouse.raw_materials.view'] = true;
  }

  return perm;
}

export const ROLE_LABELS: Record<UserRole, { title: string; desc: string; color: string }> = {
  admin: {
    title: 'مدير النظام العام (Admin)',
    desc: 'كامل الصلاحيات المطلقة على كافة أقسام وإعدادات النظام',
    color: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  production_manager: {
    title: 'مدير الإنتاج والتشغيل',
    desc: 'إدارة أوامر الشغل ومراحل التصنيع وتكاليف التشغيل',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  warehouse_keeper: {
    title: 'أمين المخازن والمستودعات',
    desc: 'إدارة مخزن الأقمشة والإكسسوارات ومخزن المنتجات التامة وتوريد الشراء',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  accountant: {
    title: 'رئيس الحسابات والتكاليف',
    desc: 'شجرة الحسابات، فواتير الشراء، حسابات الموردين والعملاء، وهوامش الربح',
    color: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  quality_supervisor: {
    title: 'مشرف ومراقب الجودة (QC)',
    desc: 'فحص الباتشات وتسجيل العيوب والفرز الأول واعتماد الجودة',
    color: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  cutter: {
    title: 'مسؤول قسم القص والتفصيل',
    desc: 'تسجيل أوزان القماش الفعلية وطباعة كروت القص والماركر',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  custom: {
    title: 'مخصص (صلاحيات مخصصة)',
    desc: 'تحديد صلاحيات دقيقة ومخصصة حسب الحاجة',
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  }
};

// Default Users Seeder (Admin is user #1)
export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user_admin',
    username: 'admin',
    fullName: 'المدير العام للمصنع (Admin)',
    role: 'admin',
    roleTitle: 'مدير عام النظام (Super Admin)',
    department: 'الإدارة العامة العليا',
    email: 'admin@factory.com',
    phone: '01000000001',
    password: 'admin',
    isActive: true,
    permissions: getAdminPermissions(),
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user_prod_mgr',
    username: 'eng_hassan',
    fullName: 'م. حسن عبد الرحمن',
    role: 'production_manager',
    roleTitle: 'مدير الإنتاج والتشغيل',
    department: 'إدارة الإنتاج والتصنيع',
    email: 'hassan@factory.com',
    phone: '01011112233',
    password: '123',
    isActive: true,
    permissions: getDefaultPermissionsForRole('production_manager'),
    createdAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'user_wh_keeper',
    username: 'tarek_store',
    fullName: 'أ. طارق محمود',
    role: 'warehouse_keeper',
    roleTitle: 'أمين مخازن الخامات والمنتجات',
    department: 'إدارة المخازن والمستودعات',
    email: 'tarek@factory.com',
    phone: '01122223344',
    password: '123',
    isActive: true,
    permissions: getDefaultPermissionsForRole('warehouse_keeper'),
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'user_accountant',
    username: 'khaled_acc',
    fullName: 'أ. خالد فؤاد',
    role: 'accountant',
    roleTitle: 'رئيس الحسابات والتكاليف',
    department: 'الإدارة المالية والحسابات',
    email: 'khaled@factory.com',
    phone: '01233334455',
    password: '123',
    isActive: true,
    permissions: getDefaultPermissionsForRole('accountant'),
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'user_qc_supervisor',
    username: 'samir_qc',
    fullName: 'أ. سمير عبد العال',
    role: 'quality_supervisor',
    roleTitle: 'مشرف ومراقب الجودة',
    department: 'إدارة توكيد ومراقبة الجودة',
    email: 'samir@factory.com',
    phone: '01544445566',
    password: '123',
    isActive: true,
    permissions: getDefaultPermissionsForRole('quality_supervisor'),
    createdAt: '2026-02-01T00:00:00.000Z'
  }
];

const USERS_STORAGE_KEY = 'factory_users_v1';
const CURRENT_SESSION_KEY = 'factory_current_session_user_v1';

export function getStoredUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const users: AppUser[] = JSON.parse(raw);
    // Ensure admin exists and has all permissions
    const adminIndex = users.findIndex(u => u.username === 'admin' || u.role === 'admin');
    if (adminIndex === -1) {
      users.unshift(DEFAULT_USERS[0]);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } else {
      // Ensure admin has full permissions
      users[adminIndex].permissions = getAdminPermissions();
    }
    return users;
  } catch (e) {
    console.error('Failed to load users from storage:', e);
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent('users_updated'));
}

/**
 * Gets the current active user.
 * CRITICAL REQUIREMENT: "اجعل اليوزر الافتراضي هو الادمن"
 * If no session is saved yet, defaults to the ADMIN user!
 */
export function getActiveSessionUser(): AppUser {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    const users = getStoredUsers();
    const adminUser = users.find(u => u.username === 'admin' || u.role === 'admin') || DEFAULT_USERS[0];

    if (!raw) {
      // Default user is Admin
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(adminUser));
      return adminUser;
    }

    const current: AppUser = JSON.parse(raw);
    // Match against latest user list to get updated permissions
    const matched = users.find(u => u.id === current.id || u.username === current.username);
    if (!matched || !matched.isActive) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(adminUser));
      return adminUser;
    }
    return matched;
  } catch (e) {
    console.error('Failed to read session user:', e);
    return DEFAULT_USERS[0];
  }
}

export function setActiveSessionUser(user: AppUser): void {
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('auth_changed'));
}

export function createStoredUser(data: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
  const users = getStoredUsers();
  
  // Check username uniqueness
  if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
    throw new Error('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر');
  }

  const newUser: AppUser = {
    ...data,
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStoredUsers(users);
  return newUser;
}

export function updateStoredUser(userId: string, data: Partial<AppUser>): AppUser {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    throw new Error('المستخدم غير موجود');
  }

  // Prevent changing admin username to something else or deactivating admin
  if (users[index].username === 'admin') {
    if (data.isActive === false) {
      throw new Error('لا يمكن تعطيل حساب مدير النظام الرئيسي');
    }
    if (data.role && data.role !== 'admin') {
      throw new Error('لا يمكن تغيير دور مدير النظام الرئيسي');
    }
  }

  const updated: AppUser = {
    ...users[index],
    ...data
  };

  users[index] = updated;
  saveStoredUsers(users);

  // If currently active user was updated, refresh session
  const currentSession = getActiveSessionUser();
  if (currentSession.id === userId) {
    setActiveSessionUser(updated);
  }

  return updated;
}

export function deleteStoredUser(userId: string): void {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (user.username === 'admin' || user.role === 'admin') {
    throw new Error('لا يمكن حذف حساب مدير النظام الرئيسي');
  }

  const filtered = users.filter(u => u.id !== userId);
  saveStoredUsers(filtered);

  // If deleted user was active, switch to admin
  const currentSession = getActiveSessionUser();
  if (currentSession.id === userId) {
    const admin = filtered.find(u => u.username === 'admin') || DEFAULT_USERS[0];
    setActiveSessionUser(admin);
  }
}

export function resetUsersToDefaults(): AppUser[] {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  setActiveSessionUser(DEFAULT_USERS[0]);
  window.dispatchEvent(new CustomEvent('users_updated'));
  return DEFAULT_USERS;
}

export function hasUserPermission(user: AppUser | null, permission: PermissionKey): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return !!user.permissions[permission];
}
