import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppUser, UserRole, PermissionKey } from '../../types';
import {
  ROLE_LABELS,
  ALL_PERMISSIONS_METADATA,
  ALL_PERMISSION_KEYS,
  getDefaultPermissionsForRole,
  getAdminPermissions
} from '../../lib/usersStorage';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  X,
  Factory,
  Layers,
  HelpCircle,
  LogIn
} from 'lucide-react';

export function UsersManagement() {
  const {
    currentUser,
    users,
    switchUser,
    addUser,
    editUser,
    removeUser,
    resetDefaults
  } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions'>('basic');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState<{
    username: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    roleTitle: string;
    department: string;
    isActive: boolean;
    permissions: Record<PermissionKey, boolean>;
  }>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'production_manager',
    roleTitle: 'مدير الإنتاج والتشغيل',
    department: 'إدارة الإنتاج',
    isActive: true,
    permissions: getDefaultPermissionsForRole('production_manager')
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormData({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: '123',
      role: 'production_manager',
      roleTitle: 'مدير الإنتاج والتشغيل',
      department: 'إدارة الإنتاج والتصنيع',
      isActive: true,
      permissions: getDefaultPermissionsForRole('production_manager')
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      password: user.password || '',
      role: user.role,
      roleTitle: user.roleTitle,
      department: user.department,
      isActive: user.isActive,
      permissions: { ...user.permissions }
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    const roleInfo = ROLE_LABELS[newRole];
    let newPerms: Record<PermissionKey, boolean>;

    if (newRole === 'admin') {
      newPerms = getAdminPermissions();
    } else {
      newPerms = getDefaultPermissionsForRole(newRole);
    }

    setFormData(prev => ({
      ...prev,
      role: newRole,
      roleTitle: roleInfo.title,
      permissions: newPerms
    }));
  };

  const togglePermission = (key: PermissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const setCategoryPermissions = (categoryName: string, enable: boolean) => {
    const categoryKeys = ALL_PERMISSIONS_METADATA.filter(p => p.category === categoryName).map(p => p.key);
    setFormData(prev => {
      const nextPerms = { ...prev.permissions };
      categoryKeys.forEach(k => {
        nextPerms[k] = enable;
      });
      return { ...prev, permissions: nextPerms };
    });
  };

  const setAllPermissions = (enable: boolean) => {
    setFormData(prev => {
      const nextPerms: Record<PermissionKey, boolean> = {} as any;
      ALL_PERMISSION_KEYS.forEach(k => {
        nextPerms[k] = enable;
      });
      return { ...prev, permissions: nextPerms };
    });
  };

  const handleSave = () => {
    if (!formData.username.trim() || !formData.fullName.trim()) {
      alert('يرجى إدخال اسم المستخدم والاسم بالكامل');
      return;
    }

    try {
      if (editingUserId) {
        editUser(editingUserId, formData);
        showToast('تم تعديل بيانات المستخدم والصلاحيات بنجاح');
      } else {
        addUser(formData);
        showToast('تمت إضافة المستخدم الجديد وتفعيل الصلاحيات بنجاح');
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleDelete = (user: AppUser) => {
    if (user.username === 'admin' || user.role === 'admin') {
      alert('لا يمكن حذف حساب مدير النظام الرئيسي');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.fullName}" نهائياً؟`)) {
      try {
        removeUser(user.id);
        showToast('تم حذف المستخدم');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل أنت متأكد من استعادة المستخدمين الافتراضيين للمصنع؟ سيتم تعيين الأدوار والصلاحيات القياسية لجميع الأقسام.')) {
      resetDefaults();
      showToast('تم استعادة المستخدمين والصلاحيات الافتراضية بنجاح');
    }
  };

  // Group permissions by category for the matrix
  const categories = Array.from(new Set(ALL_PERMISSIONS_METADATA.map(p => p.category)));

  // Filter users
  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = user.fullName.toLowerCase().includes(q);
      const matchUser = user.username.toLowerCase().includes(q);
      const matchDept = user.department?.toLowerCase().includes(q);
      const matchRole = user.roleTitle?.toLowerCase().includes(q);
      return matchName || matchUser || matchDept || matchRole;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-right pb-10" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-emerald-900 text-white rounded-xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">
                منظومة إدارة المستخدمين والصلاحيات (RBAC)
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                نشطة ومحمية
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              التحكم في أدوار عمال ومسؤولي المصنع، ضبط الصلاحيات التفصيلية لكل مرحلة وقسم، وتعيين كلمات المرور
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="استعادة المستخدمين الافتراضيين للمصنع"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>استعادة الافتراضيات</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي المستخدمين</div>
          <div className="text-2xl font-black text-slate-900 font-mono">{users.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">مسجلين بالنظام</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-800 mb-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>مديرو النظام (Admins)</span>
          </div>
          <div className="text-2xl font-black text-rose-900 font-mono">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-[10px] text-rose-700 mt-1 font-bold">كامل الصلاحيات</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>الحسابات النشطة</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">مفعلة للتشغيل</div>
        </div>

        <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-800 mb-1 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>مجموع الصلاحيات</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">
            {ALL_PERMISSION_KEYS.length}
          </div>
          <div className="text-[10px] text-indigo-700 mt-1">مستوى تحكم تفصيلي</div>
        </div>
      </div>

      {/* Current Logged in User Status Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl border-2 border-indigo-400/50 shadow-inner">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-indigo-300 font-medium">المستخدم الحالي المسجل:</span>
              <h3 className="text-base font-black text-white">{currentUser.fullName}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                {currentUser.roleTitle}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
              <span>اسم المستخدم: <strong className="font-mono text-white">@{currentUser.username}</strong></span>
              <span>•</span>
              <span>القسم: <strong>{currentUser.department}</strong></span>
            </div>
          </div>
        </div>

        <div className="text-xs text-indigo-200 bg-white/10 px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>يمكنك التبديل الفوري لأي مستخدم من القائمة أدناه لتجربة صلاحيات كل قسم في المصنع</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث بالاسم أو اسم المستخدم أو الإدارة أو الدور..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            مديرو النظام
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('production_manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'production_manager'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            الإنتاج
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('warehouse_keeper')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'warehouse_keeper'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            المخازن
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('accountant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'accountant'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            الحسابات
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.custom;
          const isCurrentUser = currentUser.id === user.id;
          const grantedPermissionsCount = Object.values(user.permissions).filter(Boolean).length;

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                isCurrentUser
                  ? 'ring-2 ring-indigo-500 border-indigo-300'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* User Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center font-black text-slate-800 text-lg shadow-2xs">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900">{user.fullName}</h4>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded">
                            أنت الآن
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400">@{user.username}</div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${roleInfo.color}`}>
                    {roleInfo.title}
                  </span>
                </div>

                {/* Info Pills */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>القسم: <strong className="text-slate-800">{user.department}</strong></span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{user.email}</span>
                    </div>
                  )}
                </div>

                {/* Permissions Meter */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>الصلاحيات الممنوحة:</span>
                    <span className="font-mono text-indigo-600">
                      {user.role === 'admin' ? 'كاملة (27/27)' : `${grantedPermissionsCount} من ${ALL_PERMISSION_KEYS.length}`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        user.role === 'admin'
                          ? 'bg-rose-500'
                          : grantedPermissionsCount > 15
                          ? 'bg-indigo-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${user.role === 'admin' ? 100 : (grantedPermissionsCount / ALL_PERMISSION_KEYS.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Instant Switch Button */}
                {!isCurrentUser ? (
                  <button
                    type="button"
                    onClick={() => switchUser(user.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="التبديل لهذا المستخدم واختبار صلاحياته"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                    <span>التبديل لحسابه</span>
                  </button>
                ) : (
                  <div className="flex-1 text-center py-1.5 px-3 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200">
                    الحساب النشط حالياً
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="تعديل المستخدم والصلاحيات"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {user.username !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف المستخدم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingUserId ? 'تعديل المستخدم والصلاحيات' : 'إضافة مستخدم جديد وضبط أدواره'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'basic'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. البيانات الأساسية والدور الوظيفي
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'permissions'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>2. مصفوفة الصلاحيات التفصيلية</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
                  {Object.values(formData.permissions).filter(Boolean).length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'basic' ? (
                /* Tab 1: Basic Info & Role */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اسم المستخدم (Username) *
                      </label>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        placeholder="e.g. mohamed_prod"
                        value={formData.username}
                        disabled={formData.username === 'admin'}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الاسم بالكامل *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. أ. محمد إبراهيم"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        كلمة المرور
                      </label>
                      <input
                        type="text"
                        placeholder="كلمة مرور الدخول"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الإدارة / القسم
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: إدارة الإنتاج، إدارة المخازن..."
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        رقم الهاتف للتواصل
                      </label>
                      <input
                        type="text"
                        placeholder="010..."
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        البريد الإلكتروني (اختياري)
                      </label>
                      <input
                        type="email"
                        dir="ltr"
                        placeholder="user@factory.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      الدور الوظيفي الرئيسي للمستخدم (Role)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => {
                        const info = ROLE_LABELS[r];
                        const isSelected = formData.role === r;

                        return (
                          <div
                            key={r}
                            onClick={() => handleRoleChange(r)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-400'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-slate-900">{info.title}</span>
                              {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{info.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">حالة تفعيل الحساب</div>
                      <div className="text-[11px] text-slate-500">
                        إذا تم تعطيل الحساب فلن يتمكن المستخدم من تسجيل الدخول للنظام
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="userActive"
                      disabled={formData.username === 'admin'}
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                /* Tab 2: Granular Permissions Matrix */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <div className="text-xs text-indigo-900 font-bold">
                      مصفوفة الصلاحيات الممنوحة: {Object.values(formData.permissions).filter(Boolean).length} من {ALL_PERMISSION_KEYS.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAllPermissions(true)}
                        className="px-2.5 py-1 bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-bold border border-indigo-200 transition-colors"
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllPermissions(false)}
                        className="px-2.5 py-1 bg-white text-slate-600 hover:bg-slate-200 rounded-md text-xs font-bold border border-slate-200 transition-colors"
                      >
                        إلغاء الكل
                      </button>
                    </div>
                  </div>

                  {/* Category Blocks */}
                  {categories.map(category => {
                    const categoryPermissions = ALL_PERMISSIONS_METADATA.filter(p => p.category === category);
                    const allCategoryEnabled = categoryPermissions.every(p => formData.permissions[p.key]);

                    return (
                      <div key={category} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="bg-slate-100/80 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
                          <span className="text-xs font-black text-slate-800">{category}</span>
                          <button
                            type="button"
                            onClick={() => setCategoryPermissions(category, !allCategoryEnabled)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            {allCategoryEnabled ? 'إلغاء قسم ' + category : 'تحديد قسم ' + category}
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {categoryPermissions.map(meta => {
                            const isGranted = !!formData.permissions[meta.key];

                            return (
                              <label
                                key={meta.key}
                                className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  onChange={() => togglePermission(meta.key)}
                                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-900">{meta.label}</div>
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {meta.description}
                                  </div>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {meta.key}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {activeTab === 'basic' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('permissions')}
                  className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                >
                  التالي: ضبط الصلاحيات التفصيلية ←
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  → العودة للبيانات الأساسية
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ المستخدم والصلاحيات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
