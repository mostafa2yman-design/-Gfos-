import React, { useState } from 'react';
import { Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { getOrders, deleteAllOrders } from '../lib/storage';

interface SettingsProps {
  onBack?: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const ordersCount = getOrders().length;

  const handleDeleteAll = () => {
    setShowConfirm(true);
    setConfirmText('');
    setMessage(null);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    setMessage(null);

    // Give UI time to update
    setTimeout(() => {
      const success = deleteAllOrders();
      setIsDeleting(false);
      
      if (success) {
        setMessage({ text: `تم حذف ${ordersCount} أمر إنتاج بنجاح.`, type: 'success' });
        setShowConfirm(false);
      } else {
        setMessage({ text: 'تعذر حذف أوامر الإنتاج.', type: 'error' });
      }
    }, 500);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setConfirmText('');
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2">أوامر الإنتاج</h3>
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
