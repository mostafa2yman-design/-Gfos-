import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Calendar,
  Search,
  Filter,
  Users,
  PackageSearch,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  TrendingDown,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { PurchaseInvoice, PurchasePaymentStatus } from '../../types';
import {
  getPurchases,
  savePurchases,
  addPurchase,
  updatePurchase,
  deletePurchase
} from '../../lib/purchasesStorage';
import { PurchaseInvoiceFormModal } from './PurchaseInvoiceFormModal';
import { PurchaseInvoiceDetailsModal } from './PurchaseInvoiceDetailsModal';
import { QuickAddSupplierModal } from './QuickAddSupplierModal';
import { QuickAddMaterialModal } from './QuickAddMaterialModal';

interface PurchasesDashboardProps {
  onNavigateToAccounting?: (tab: 'customers' | 'materials', autoOpenAdd?: boolean) => void;
}

export function PurchasesDashboard({ onNavigateToAccounting }: PurchasesDashboardProps) {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Date Range State (User-specified period filter: "خلال فترة معينة اقوم انا بتحديدها")
  const [datePreset, setDatePreset] = useState<string>('month'); // default: this month
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modal states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Quick addition modals from shortcuts
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
  const [showQuickMaterialModal, setShowQuickMaterialModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Load purchases
  const loadData = () => {
    setPurchases(getPurchases());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('purchases_updated', handleUpdate);
    return () => window.removeEventListener('purchases_updated', handleUpdate);
  }, []);

  // Quick Date Range Presets
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const d = new Date(today);
      const day = d.getDay(); // 0 is Sunday
      // In Middle East / Egypt week starts Saturday (6) or Sunday (0)
      const diff = d.getDate() - day + (day === 6 ? 0 : -1);
      const startOfWeek = new Date(d.setDate(diff));
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'last30') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDayOfYear.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Suppliers list for dropdown
  const uniqueSuppliers = useMemo(() => {
    const map = new Map<string, string>();
    purchases.forEach((p) => {
      if (p.supplierId && p.supplierName) {
        map.set(p.supplierId, p.supplierName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [purchases]);

  // Filtered Purchases based on user-specified period, search, and status
  const filteredPurchases = useMemo(() => {
    return purchases.filter((inv) => {
      // Date Filter
      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;

      // Supplier Filter
      if (selectedSupplierFilter !== 'all' && inv.supplierId !== selectedSupplierFilter) {
        return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all' && inv.paymentStatus !== selectedStatusFilter) {
        return false;
      }

      // Search Query (invoice number, supplier name, notes, ref)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesInvNo = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesSupp = inv.supplierName?.toLowerCase().includes(q);
        const matchesNotes = inv.notes?.toLowerCase().includes(q);
        const matchesRef = inv.referenceNumber?.toLowerCase().includes(q);
        const matchesItem = inv.items?.some((it) => it.materialName?.toLowerCase().includes(q));
        if (!matchesInvNo && !matchesSupp && !matchesNotes && !matchesRef && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, startDate, endDate, selectedSupplierFilter, selectedStatusFilter, searchQuery]);

  // KPI Calculations for the selected period
  const stats = useMemo(() => {
    const totalAmount = filteredPurchases.reduce((s, p) => s + (Number(p.grandTotal) || 0), 0);
    const paidAmount = filteredPurchases.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
    const remainingAmount = filteredPurchases.reduce((s, p) => s + (Number(p.remainingAmount) || 0), 0);
    const totalInvoices = filteredPurchases.length;
    const totalItemsCount = filteredPurchases.reduce((s, p) => s + (p.items?.length || 0), 0);
    const totalQuantity = filteredPurchases.reduce(
      (s, p) => s + (p.items?.reduce((is, it) => is + (Number(it.quantity) || 0), 0) || 0),
      0
    );

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      totalInvoices,
      totalItemsCount,
      totalQuantity,
    };
  }, [filteredPurchases]);

  // Handlers for Save, Edit, Delete
  const handleSaveInvoice = (invoice: PurchaseInvoice) => {
    if (editingInvoice) {
      updatePurchase(invoice);
      setNotification({ message: `تم تحديث فاتورة الشراء رقم ${invoice.invoiceNumber} بنجاح`, type: 'success' });
    } else {
      addPurchase(invoice);
      setNotification({ message: `تمت إضافة فاتورة الشراء رقم ${invoice.invoiceNumber} بنجاح`, type: 'success' });
    }
    setEditingInvoice(null);
    setShowInvoiceForm(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (confirm(`هل أنت متأكد من حذف فاتورة الشراء ${invoiceNumber}؟`)) {
      deletePurchase(id);
      setNotification({ message: `تم حذف الفاتورة ${invoiceNumber}`, type: 'info' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  const getStatusBadge = (status: PurchasePaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>مدفوع</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>جزئي</span>
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            <span>آجل</span>
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: PurchaseInvoice['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return <span className="text-slate-600 font-semibold">نقدي (خزينة)</span>;
      case 'bank':
        return <span className="text-indigo-600 font-semibold">تحويل بنكي</span>;
      case 'credit':
        return <span className="text-amber-700 font-semibold">آجل (موردين)</span>;
      case 'cheque':
        return <span className="text-purple-700 font-semibold">شيك</span>;
      default:
        return <span>{method}</span>;
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 left-5 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slideUp ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">إدارة فواتير المشتريات</h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                المبيعات والمشتريات
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              متابعة توريدات الخامات، مستلزمات الإنتاج، حسابات الموردين وتدفقات النقدية الخارجة
            </p>
          </div>
        </div>

        {/* Header Actions & Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Quick Shortcut: Add Supplier */}
          <button
            onClick={() => setShowQuickSupplierModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            title="إضافة مورد جديد في التكوين الهيكلي"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>+ إضافة مورد</span>
          </button>

          {/* Quick Shortcut: Add Material to Structural Configuration */}
          <button
            onClick={() => setShowQuickMaterialModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            title="إضافة صنف خام جديد للتكوين الهيكلي"
          >
            <PackageSearch className="w-4 h-4 text-indigo-600" />
            <span>+ إضافة صنف هيكلي</span>
          </button>

          {/* Primary CTA: Add Purchase Invoice */}
          <button
            onClick={() => {
              setEditingInvoice(null);
              setShowInvoiceForm(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فاتورة شراء</span>
          </button>
        </div>
      </div>

      {/* Date Range & Period Filter Bar ("يظهر فيها تفاصيل المشتريات اللى اشتريتها خلال فتره معينه اقوم انا بتحديدها") */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">تحديد فترة المشتريات:</span>
            {startDate || endDate ? (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                {startDate ? `من ${startDate}` : 'من البداية'} {endDate ? `إلى ${endDate}` : 'إلى الآن'}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                عرض جميع الفترات
              </span>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => applyDatePreset('today')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => applyDatePreset('week')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === 'week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => applyDatePreset('month')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === 'month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => applyDatePreset('last30')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === 'last30'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => applyDatePreset('year')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === 'year'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              هذا العام
            </button>
            <button
              onClick={() => applyDatePreset('all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              كل الفترات
            </button>
          </div>
        </div>

        {/* Custom Date Pickers & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">تصفية بحسب المورد</label>
            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="all">جميع الموردين ({uniqueSuppliers.length})</option>
              {uniqueSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">حالة السداد</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">مدفوع بالكامل</option>
              <option value="partial">مدفوع جزئياً</option>
              <option value="unpaid">آجل / غير مدفوع</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي المشتريات في الفترة</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.totalAmount.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            صافي القيمة بعد الخصومات والضرائب
          </div>
        </div>

        {/* Invoices Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">عدد فواتير الشراء</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.totalInvoices}{' '}
            <span className="text-xs font-bold text-slate-500">فاتورة</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إجمالي {stats.totalItemsCount} بند توريد ({stats.totalQuantity.toLocaleString('ar-EG')} وحدة/كجم)
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">المسدد نقداً وبنكياً</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {stats.paidAmount.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-emerald-600">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تدفق نقدية خارج فعلي من الخزينة/البنك
          </div>
        </div>

        {/* Remaining (Credit) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">المتبقي الآجل للموردين</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${stats.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {stats.remainingAmount.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            مستحقات واجبة السداد للشركات الموردة
          </div>
        </div>
      </div>

      {/* Invoices List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الفاتورة، اسم المورد، صنف أو ملاحظة..."
                className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>عدد النتائج: {filteredPurchases.length} فاتورة</span>
          </div>
        </div>

        {/* Table Content */}
        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد فواتير مشتريات تطابق الفترة المحددة</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              لم يتم العثور على أية فواتير خلال التاريخ المحدد أو ببيانات البحث الحالية. يمكنك تغيير الفترة أو إضافة فاتورة شراء جديدة.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => applyDatePreset('all')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                عرض كل الفترات
              </button>
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setShowInvoiceForm(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                + إضافة فاتورة شراء جديدة
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3.5 text-center w-10"></th>
                  <th className="p-3.5">رقم الفاتورة</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المورد</th>
                  <th className="p-3.5 text-center">الأصناف</th>
                  <th className="p-3.5 text-center">الكمية</th>
                  <th className="p-3.5 text-left">إجمالي الفاتورة</th>
                  <th className="p-3.5 text-left">المسدد</th>
                  <th className="p-3.5 text-left">المتبقي</th>
                  <th className="p-3.5 text-center">السداد</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center w-28">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const totalQty = inv.items?.reduce((s, it) => s + (Number(it.quantity) || 0), 0) || 0;

                  return (
                    <React.Fragment key={inv.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                        {/* Expand Row Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleExpand(inv.id)}
                            className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                            title={isExpanded ? 'طي التفاصيل' : 'عرض الأصناف والبنود'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Invoice Number */}
                        <td className="p-3">
                          <span className="font-bold text-indigo-700 block">{inv.invoiceNumber}</span>
                          {inv.referenceNumber && (
                            <span className="text-[10px] text-slate-400 block">{inv.referenceNumber}</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="p-3 text-slate-700 font-semibold whitespace-nowrap">
                          {new Date(inv.date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Supplier */}
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{inv.supplierName}</span>
                          {inv.supplierPhone && (
                            <span className="text-[10px] text-slate-500 block">{inv.supplierPhone}</span>
                          )}
                        </td>

                        {/* Items Count */}
                        <td className="p-3 text-center">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
                            {inv.items?.length || 0} صنف
                          </span>
                        </td>

                        {/* Total Quantity */}
                        <td className="p-3 text-center font-bold text-slate-800">
                          {totalQty.toLocaleString('ar-EG')}
                        </td>

                        {/* Grand Total */}
                        <td className="p-3 text-left font-black text-slate-900">
                          {inv.grandTotal.toLocaleString('ar-EG')} ج.م
                        </td>

                        {/* Paid Amount */}
                        <td className="p-3 text-left font-bold text-emerald-700">
                          {inv.paidAmount.toLocaleString('ar-EG')} ج.م
                        </td>

                        {/* Remaining Amount */}
                        <td className="p-3 text-left">
                          <span
                            className={`font-bold ${
                              inv.remainingAmount > 0 ? 'text-rose-600 font-black' : 'text-slate-400'
                            }`}
                          >
                            {inv.remainingAmount > 0 ? `${inv.remainingAmount.toLocaleString('ar-EG')} ج.م` : '—'}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="p-3 text-center text-[11px]">
                          {getPaymentMethodBadge(inv.paymentMethod)}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          {getStatusBadge(inv.paymentStatus)}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewingInvoice(inv)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="عرض تفاصيل الفاتورة والطباعة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingInvoice(inv);
                                setShowInvoiceForm(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="تعديل الفاتورة"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Row showing Items Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={12} className="p-4 pr-12">
                            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>تفاصيل خامات وأصناف الفاتورة ({inv.items?.length} أصناف):</span>
                                {inv.notes && (
                                  <span className="text-[11px] text-slate-500 font-normal">
                                    ملاحظات: {inv.notes}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {inv.items?.map((it, idx) => (
                                  <div
                                    key={it.id || idx}
                                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900 block">{it.materialName}</span>
                                      <span className="text-[10px] text-slate-500 block mt-0.5">
                                        الكمية: {it.quantity} {it.unit} • السعر: {it.unitPrice} ج.م
                                        {it.discount > 0 && ` • خصم: ${it.discount} ج.م`}
                                      </span>
                                    </div>
                                    <span className="font-black text-indigo-700 text-xs">
                                      {it.total.toLocaleString('ar-EG')} ج.م
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Invoice Modal */}
      {showInvoiceForm && (
        <PurchaseInvoiceFormModal
          invoice={editingInvoice}
          onClose={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveInvoice}
          onNavigateToAccounting={onNavigateToAccounting}
        />
      )}

      {/* Invoice Details & Print Modal */}
      {viewingInvoice && (
        <PurchaseInvoiceDetailsModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEdit={(inv) => {
            setViewingInvoice(null);
            setEditingInvoice(inv);
            setShowInvoiceForm(true);
          }}
        />
      )}

      {/* Quick Add Supplier Modal from Shortcut */}
      {showQuickSupplierModal && (
        <QuickAddSupplierModal
          onClose={() => setShowQuickSupplierModal(false)}
          onSuccess={(newSupp) => {
            setNotification({
              message: `تمت إضافة المورد "${newSupp.name}" بنجاح في التكوين الهيكلي`,
              type: 'success',
            });
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}

      {/* Quick Add Material Modal from Shortcut */}
      {showQuickMaterialModal && (
        <QuickAddMaterialModal
          onClose={() => setShowQuickMaterialModal(false)}
          onSuccess={(newMat) => {
            setNotification({
              message: `تمت إضافة الصنف "${newMat.name}" بنجاح في أصناف التكوين الهيكلي`,
              type: 'success',
            });
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}
    </div>
  );
}
