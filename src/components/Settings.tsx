import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, AlertTriangle, Download, Database, Building2, Upload, FolderOpen } from 'lucide-react';
import { getOrders, deleteAllOrders, exportData, importData, getFactorySettings, saveFactorySettings } from '../lib/storage';
import { getAllBackups, BackupRecord, setBackupDirectoryHandle, getBackupDirectoryHandle, verifyDirectoryPermission } from '../lib/backupManager';

interface SettingsProps {
  onBack?: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [backups, setBackups] = useState<BackupRecord[]>([]);


  const [hasExternalFolder, setHasExternalFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Factory Profile State
  const [factoryName, setFactoryName] = useState('');
  const [factoryAddress, setFactoryAddress] = useState('');
  const [factoryPhones, setFactoryPhones] = useState('');
  const [factoryLogo, setFactoryLogo] = useState<string | null>(null);

  useEffect(() => {
    getOrders().then(data => setOrdersCount(data.length));
    loadBackups();
    checkExternalFolder();
    
    const settings = getFactorySettings();
    if (settings) {
      setFactoryName(settings.name);
      setFactoryAddress(settings.address);
      setFactoryPhones(settings.phones);
      setFactoryLogo(settings.logoUrl);
    }
  }, []);

  const checkExternalFolder = async () => {
    const handle = await getBackupDirectoryHandle();
    if (handle) {
      setHasExternalFolder(true);
      verifyDirectoryPermission(handle, 'readwrite').then(granted => {
         if(!granted) {
            setMessage({ text: 'تم إعداد مجلد للنسخ الاحتياطي سابقاً، يرجى إعادة السماح بالوصول إليه من زر "تحديث الصلاحية".', type: 'error' });
         }
      });
    } else {
      setHasExternalFolder(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setMessage({ text: 'متصفحك لا يدعم اختيار مجلد للنسخ التلقائي للديسك. يرجى استخدام جوجل كروم أو إيدج.', type: 'error' });
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await setBackupDirectoryHandle(handle);
      setHasExternalFolder(true);
      setMessage({ text: 'تم تحديد مجلد النسخ الاحتياطي التلقائي بنجاح.', type: 'success' });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessage({ text: 'حدث خطأ أثناء تحديد المجلد.', type: 'error' });
      }
    }
  };
  
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.success) {
        setMessage({ text: `تم استيراد ${result.count} أمر إنتاج بنجاح.`, type: 'success' });
        getOrders().then(data => setOrdersCount(data.length));
      } else {
        setMessage({ text: result.error || 'فشل استيراد النسخة الاحتياطية.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'حدث خطأ أثناء قراءة الملف.', type: 'error' });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const loadBackups = async () => {
    const records = await getAllBackups();
    // Sort descending by timestamp
    records.sort((a, b) => b.timestamp - a.timestamp);
    setBackups(records);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFactoryLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSaveFactorySettings = () => {
    const success = saveFactorySettings({
      name: factoryName,
      address: factoryAddress,
      phones: factoryPhones,
      logoUrl: factoryLogo,
    });
    if (success) {
      setMessage({ text: 'تم حفظ بيانات المصنع بنجاح.', type: 'success' });
      window.scrollTo(0, 0);
    } else {
      setMessage({ text: 'فشل حفظ بيانات المصنع. قد يكون حجم الشعار كبيراً جداً.', type: 'error' });
    }
  };

  const handleManualExport = async () => {
    try {
      const data = await exportData();
      downloadJSON(data, `gfos_manual_backup_${new Date().toISOString().split('T')[0]}.json`);
      setMessage({ text: 'تم تصدير البيانات بنجاح.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'فشل تصدير البيانات.', type: 'error' });
    }
  };

  const downloadBackup = (record: BackupRecord) => {
    downloadJSON(record.data, `gfos_auto_backup_${record.date}.json`);
  };

  const downloadJSON = (jsonString: string, filename: string) => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = () => {
    setShowConfirm(true);
    setConfirmText('');
    setMessage(null);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    setMessage(null);
    // Give UI time to update
    setTimeout(async () => {
      const success = await deleteAllOrders();
      setIsDeleting(false);
      
      if (success) {
        setMessage({ text: `تم حذف ${ordersCount} أمر إنتاج بنجاح.`, type: 'success' });
        setShowConfirm(false);
        setOrdersCount(0);
      } else {
        setMessage({ text: 'تعذر حذف أوامر الإنتاج.', type: 'error' });
      }
    }, 500);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setConfirmText('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-slate-200 p-2 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">الإعدادات</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Factory Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            بيانات المصنع
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            هذه البيانات ستظهر في لوحة التحكم وتتم طباعتها على أوامر الإنتاج والتشغيل.
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">اسم المصنع</label>
            <input
              type="text"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: مصنع الأمل للملابس الجاهزة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">أرقام التواصل</label>
            <input
              type="text"
              value={factoryPhones}
              onChange={(e) => setFactoryPhones(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: 01000000000 - 01111111111"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">عنوان المصنع</label>
            <input
              type="text"
              value={factoryAddress}
              onChange={(e) => setFactoryAddress(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: المنطقة الصناعية الأولى، قطعة 15، العاشر من رمضان"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">شعار المصنع (اللوجو)</label>
            <div className="flex items-center gap-4">
              {factoryLogo && (
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  <img src={factoryLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    اختيار صورة
                  </button>
                  {factoryLogo && (
                    <button
                      onClick={() => setFactoryLogo(null)}
                      className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm"
                    >
                      إزالة الشعار
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">يفضل استخدام صورة مربعة بحجم لا يتجاوز 1 ميجابايت.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-left">
          <button
            onClick={handleSaveFactorySettings}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
          >
            حفظ بيانات المصنع
          </button>
        </div>
      </div>

      
      {/* Folder Config Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-600" />
            مجلد الحفظ التلقائي للديسك
          </h3>
          <p className="text-slate-500 text-sm max-w-xl">
            لتأمين بياناتك أكثر، يمكنك تحديد مجلد على جهازك ليقوم النظام بحفظ نسخة يومية بداخله مباشرة (تعمل الميزة في متصفحات كروم وإيدج).
          </p>
        </div>
        <button
          onClick={handleSelectFolder}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border flex items-center gap-2 shadow-sm whitespace-nowrap ${
            hasExternalFolder 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          {hasExternalFolder ? 'تحديث صلاحية المجلد / تغييره' : 'تحديد مجلد النسخ التلقائي'}
        </button>
      </div>

      {/* Backups Section */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              النسخ الاحتياطي التلقائي
            </h3>
            <p className="text-slate-500 text-sm">
              يقوم النظام تلقائياً بأخذ نسخة احتياطية يومية الساعة 12 صباحاً ويحتفظ بها لمدة 30 يوماً داخل المتصفح. يمكنك تحميلها كملف للديسك في أي وقت.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors border border-slate-200 flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              استيراد نسخة
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportBackup} />
            <button
              onClick={handleManualExport}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium text-sm transition-colors border border-indigo-200 flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              تنزيل يدوياً
            </button>
          </div>

        </div>
        
        <div className="p-0">
          {backups.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              لا توجد نسخ احتياطية تلقائية حتى الآن. ستظهر هنا بداية من الغد.
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">التاريخ</th>
                  <th className="px-6 py-3 font-medium">الوقت</th>
                  <th className="px-6 py-3 font-medium">الحجم</th>
                  <th className="px-6 py-3 font-medium text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map(record => {
                  const d = new Date(record.timestamp);
                  return (
                    <tr key={record.date} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-900" dir="ltr">{record.date}</td>
                      <td className="px-6 py-3 text-slate-600">{d.toLocaleTimeString('ar-EG')}</td>
                      <td className="px-6 py-3 text-slate-600" dir="ltr">{formatSize(record.size)}</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => downloadBackup(record)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-xs font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تنزيل للديسك
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2 text-red-600">منطقة الخطر</h3>
          <p className="text-slate-500 text-sm">
            يمكنك استخدام هذا الإجراء لمسح جميع أوامر الإنتاج التجريبية الموجودة في النظام.
          </p>
        </div>
        
        <div className="p-6 bg-slate-50">
          <button
            onClick={handleDeleteAll}
            disabled={ordersCount === 0 || isDeleting}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-colors ${
              ordersCount === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
            }`}
          >
            {ordersCount === 0 ? 'لا توجد أوامر إنتاج للحذف' : 'مسح جميع أوامر الإنتاج'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">تحذير</h3>
              <p className="text-slate-600 text-sm mb-6">
                سيتم حذف جميع أوامر الإنتاج الموجودة حاليًا وما يرتبط بها من بيانات تشغيلية. لا يمكن التراجع عن هذا الإجراء. 
                <br/><strong>تأكد من تنزيل نسخة احتياطية أولاً!</strong>
              </p>
              
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                <p className="font-bold text-red-800">
                  عدد الأوامر التي سيتم حذفها: {ordersCount} أمر
                </p>
              </div>

              <div className="mb-6 text-right">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  يرجى كتابة <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">RESET</span> للتأكيد:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="اكتب RESET هنا"
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 text-center text-lg tracking-widest font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={confirmText !== 'RESET' || isDeleting}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-white transition-colors ${
                    confirmText !== 'RESET' || isDeleting
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-sm'
                  }`}
                >
                  {isDeleting ? 'جاري حذف أوامر الإنتاج...' : 'حذف جميع الأوامر'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
