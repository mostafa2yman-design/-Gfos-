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
  PackageCheck
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getPrimaryBg, getPrimaryText, getRadiusClass } from "../lib/theme";

interface LayoutProps {
  children: React.ReactNode;
  currentView: "dashboard" | "list" | "form" | "settings" | "accounting_config" | "finished_goods_warehouse";
  onNavigate: (view: "dashboard" | "list" | "form" | "settings" | "accounting_config" | "finished_goods_warehouse") => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { color, radius } = useTheme();
  
  const [expandedSection, setExpandedSection] = useState<string>("admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: "dashboard" | "list" | "form" | "settings" | "accounting_config" | "finished_goods_warehouse") => {
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
                  onClick={() => handleNavClick("accounting_config")}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 text-sm font-bold transition-all ${radiusClass} ${
                    currentView === "accounting_config"
                      ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  التكوين الهيكلي والمالي
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
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full print:p-0 print:m-0 print:max-w-none">
          {children}
        </div>
      </main>
      
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
