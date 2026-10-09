import React, { useState } from "react";
import {
  Calculator,
  Factory,
  LayoutDashboard,
  ListPlus,
  FileText,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Users,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Grid,
  Menu,
  X,
  PackageCheck,
  ShoppingCart,
  Boxes,
  BookOpen,
  Scale,
  TrendingUp,
  Building
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getPrimaryBg, getPrimaryText, getRadiusClass } from "../lib/theme";
import { UserNavDropdown } from "./users/UserNavDropdown";
import { SystemAuditLogModal } from "./audit/SystemAuditLogModal";

export type LayoutViewType = "dashboard" | "list" | "form" | "settings" | "accounting_config" | "finished_goods_warehouse" | "purchases" | "sales" | "raw_materials_warehouse" | "users" | "journal_entries" | "general_ledger" | "trial_balance" | "income_statement" | "balance_sheet" | "cash_flow" | "treasury";

interface LayoutProps {
  children: React.ReactNode;
  currentView: LayoutViewType;
  onNavigate: (view: LayoutViewType) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { color, radius } = useTheme();
  
  const [expandedSection, setExpandedSection] = useState<string>("admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const handleNavClick = (view: LayoutViewType) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  const primaryBg = getPrimaryBg(color);
  const radiusClass = getRadiusClass(radius);

  return (
    <div className="flex h-screen bg-slate-100 flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#0f172a] p-4 text-white print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-slate-800 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold leading-tight">نسيج ERP</h1>
        </div>
        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${primaryBg} ${radiusClass}`}>
          <Factory className={color === 'orange' ? 'text-slate-900 w-4 h-4' : 'text-white w-4 h-4'} />
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-slate-300 flex flex-col flex-shrink-0 print:hidden overflow-y-auto transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 -ml-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 justify-end flex-1">
            <div className="text-right">
              <h1 className="text-2xl font-bold text-white leading-tight">نسيج ERP</h1>
              <p className="text-xs text-slate-400 font-medium">نظام مصانع الملابس المتكامل</p>
            </div>
            <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${primaryBg} ${radiusClass}`}>
              <Factory className={color === 'orange' ? 'text-slate-900 w-6 h-6' : 'text-white w-6 h-6'} />
            </div>
          </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {/* Section 1: Admin */}
          <div>
            <button 
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              {expandedSection === 'admin' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex items-center gap-3">
                <span>نظام الإدارة وشاشات التحكم</span>
                <Grid className={`w-5 h-5 ${expandedSection === 'admin' ? getPrimaryText(color) : 'text-slate-500'}`} />
              </div>
            </button>
            {expandedSection === 'admin' && (
              <div className="mt-1 space-y-1 mb-3">
                <button
                  onClick={() => handleNavClick("dashboard")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "dashboard"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>لوحة التحكم الرئيسية</span>
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("users")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "users"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>المستخدمين والصلاحيات (RBAC)</span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} text-slate-400 hover:text-white hover:bg-slate-800`}
                >
                  <span>مركز التقارير والإحصائيات الكلية</span>
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Factory */}
          <div>
            <button 
              onClick={() => toggleSection('factory')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              {expandedSection === 'factory' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex items-center gap-3">
                <span>تخطيط وتشغيل المصنع الميداني</span>
                <Factory className={`w-5 h-5 ${expandedSection === 'factory' ? getPrimaryText(color) : 'text-slate-500'}`} />
              </div>
            </button>
            {expandedSection === 'factory' && (
              <div className="mt-1 space-y-1 mb-3">
                <button
                  onClick={() => handleNavClick("list")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "list"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>أوامر الإنتاج</span>
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("form")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "form"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>أمر إنتاج أولي</span>
                  <ListPlus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* Section 3: Finance */}
          <div>
            <button 
              onClick={() => toggleSection('accounting')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              {expandedSection === 'accounting' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex items-center gap-3">
                <span>المحاسبة المالية والحسابات العامة</span>
                <Briefcase className={`w-5 h-5 ${expandedSection === 'accounting' ? getPrimaryText(color) : 'text-slate-500'}`} />
              </div>
            </button>
            {expandedSection === 'accounting' && (
              <div className="mt-1 space-y-1 mb-3">
                <button
                  onClick={() => handleNavClick("journal_entries")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "journal_entries"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>دفتر القيود اليومية (المزدوجة)</span>
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("general_ledger")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "general_ledger"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>دفتر الأستاذ العام للحسابات</span>
                  <Scale className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("trial_balance")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "trial_balance"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>ميزان المراجعة (بالمجاميع والأرصدة)</span>
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("income_statement")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "income_statement"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>قائمة الدخل والأرباح والخسائر (P&L)</span>
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  onClick={() => handleNavClick("cash_flow")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "cash_flow"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>قائمة التدفقات النقدية (Cash Flow)</span>
                  </span>
                  <DollarSign className="w-4 h-4 text-teal-400" />
                </button>
                <button
                  onClick={() => handleNavClick("balance_sheet")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "balance_sheet"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>قائمة المركز المالي (الميزانية العمومية)</span>
                  </span>
                  <Building className="w-4 h-4 text-indigo-400" />
                </button>
                <button
                  onClick={() => handleNavClick("accounting_config")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "accounting_config"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>شجرة الحسابات والتكوين المالي</span>
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("treasury")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "treasury"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>إيرادات ومصروفات (الخزينة)</span>
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Sales & Purchases */}
          <div>
            <button 
              onClick={() => toggleSection('sales')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              {expandedSection === 'sales' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
              <div className="flex items-center gap-3">
                <span>المبيعات والمشتريات وتدفق النقدية</span>
                <Briefcase className={`w-5 h-5 ${expandedSection === 'sales' ? getPrimaryText(color) : 'text-slate-500'}`} />
              </div>
            </button>
            {expandedSection === 'sales' && (
              <div className="mt-1 space-y-1 mb-3">
                <button
                  onClick={() => handleNavClick("sales")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "sales"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>إدارة المبيعات وفواتير العملاء</span>
                  <TrendingUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("purchases")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "purchases"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>إدارة المشتريات وفواتير الشراء</span>
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("raw_materials_warehouse")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "raw_materials_warehouse"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>مخزن الأقمشة والإكسسوارات</span>
                  <Boxes className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("finished_goods_warehouse")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "finished_goods_warehouse"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>مخزن المنتجات التامة</span>
                  <PackageCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavClick("treasury")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "treasury"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>إيرادات ومصروفات وسندات الخزينة</span>
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => setShowAuditModal(true)}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold transition-all ${radiusClass} text-slate-400 hover:text-white hover:bg-slate-800`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>سجل الاعتمادات والرقابة الإدارية</span>
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Costing */}
          <div>
            <button className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
              <ChevronDown className="w-4 h-4" />
              <div className="flex items-center gap-3">
                <span>تحليل تكلفة الموديل ونقاط التعادل</span>
                <DollarSign className="w-5 h-5 text-slate-500" />
              </div>
            </button>
          </div>

          {/* Section 6: HR */}
          <div>
            <button className="w-full flex items-center justify-between py-3 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
              <ChevronDown className="w-4 h-4" />
              <div className="flex items-center gap-3">
                <span>الموارد البشرية ومستحقات العمال فنيين</span>
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </button>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto border-t border-slate-800 pt-4 pb-2 px-4">
          <button
            onClick={() => handleNavClick("settings")}
            className={`w-full flex items-center justify-end gap-3 px-4 py-3 mb-2 text-sm font-bold transition-all ${radiusClass} ${
              currentView === "settings"
                ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>إعدادات النظام</span>
            <SettingsIcon className="w-5 h-5" />
          </button>
          
          <div className="flex justify-between items-center px-2 py-3 text-[#334155] border-t border-[#1e293b]">
            <ShieldCheck className="w-4 h-4 text-[#475569]" />
            <span className="text-[10px] text-[#64748b]">آخر مزامنة/حفظ: ١٠:١٤:٠١ م</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
        {/* Top Header Bar with User Nav Dropdown */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">نسيج ERP /</span>
            <span className="text-xs font-bold text-slate-800">
              {currentView === "dashboard" && "لوحة التحكم الرئيسية"}
              {currentView === "list" && "أوامر الإنتاج والتصنيع"}
              {currentView === "form" && "إدارة أمر التشغيل والباتشات"}
              {currentView === "users" && "إدارة المستخدمين والصلاحيات (RBAC)"}
              {currentView === "purchases" && "إدارة المشتريات وفواتير الشراء"}
              {currentView === "raw_materials_warehouse" && "مخزن الأقمشة والإكسسوارات"}
              {currentView === "finished_goods_warehouse" && "مخزن المنتجات التامة"}
              {currentView === "accounting_config" && "التكوين الهيكلي والمالي"}
              {currentView === "treasury" && "إدارة الإيرادات والمصروفات وحركة الخزينة والسيولة"}
              {currentView === "settings" && "إعدادات النظام"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="سجل وتوثيق اعتمادات وحركات النظام"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">سجل الاعتمادات</span>
            </button>
            <UserNavDropdown onNavigateToUsers={() => handleNavClick("users")} />
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full print:p-0 print:m-0 print:max-w-none flex-1">
          {children}
        </div>
      </main>

      {/* System Audit & Approvals Log Modal */}
      {showAuditModal && (
        <SystemAuditLogModal onClose={() => setShowAuditModal(false)} />
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
