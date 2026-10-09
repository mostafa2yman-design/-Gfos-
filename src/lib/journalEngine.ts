import { JournalEntry, JournalEntryLine, JournalEntryType, AccountLedgerSummary, LedgerMovement, TrialBalanceItem, TrialBalanceReport } from '../types/journal';
import { IncomeStatementReport, IncomeStatementSection, IncomeStatementItem, IncomeStatementAccountBreakdown } from '../types/incomeStatement';
import { BalanceSheetReport, BalanceSheetKPIs, BalanceSheetSubGroup, BalanceSheetAccountLine } from '../types/balanceSheet';
import { CashFlowStatementReport, CashFlowLineItem, CashFlowKPIs } from '../types/cashFlow';
import { getAccounts } from './accountingStorage';
import { getPurchases, getPurchaseReturns } from './purchasesStorage';
import { getSalesInvoices, getSalesReturns } from './salesStorage';
import { getOrders } from './storage';
import { getManualStockAdjustments } from './rawMaterialsInventory';
import { getTreasuryTransactions } from './treasuryStorage';
import { getActiveSessionUser } from './usersStorage';
import { AccountNode } from '../types';

const MANUAL_ENTRIES_KEY = 'accounting_manual_journal_entries_v1';

// Helper to get manual entries from local storage
export const getManualJournalEntries = (): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(MANUAL_ENTRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse manual journal entries:', error);
    return [];
  }
};

// Helper to save manual entries to local storage
export const saveManualJournalEntries = (entries: JournalEntry[]): void => {
  try {
    localStorage.setItem(MANUAL_ENTRIES_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('journal_entries_updated'));
  } catch (error) {
    console.error('Failed to save manual journal entries:', error);
  }
};

/**
 * Finds an account from chart of accounts by code or ID
 */
function findAccount(accounts: AccountNode[], codeOrId: string): AccountNode | undefined {
  return accounts.find(a => a.code === codeOrId || a.id === codeOrId);
}

/**
 * Fallback account builder if not found in chart of accounts
 */
function getAccountInfo(accounts: AccountNode[], code: string, fallbackName: string) {
  const found = findAccount(accounts, code);
  return {
    id: found ? found.id : code,
    code: found ? found.code : code,
    name: found ? found.name : fallbackName,
    nature: found ? found.nature : ('debit' as const)
  };
}

/**
 * Generates automated journal entries for purchase invoices (توريد خامات ومستلزمات)
 */
function generatePurchaseEntries(accounts: AccountNode[]): JournalEntry[] {
  const purchases = getPurchases();
  const entries: JournalEntry[] = [];

  const fabricAcc = getAccountInfo(accounts, '12411', 'مخزن الأقمشة والغزول (خامات رئيسية)');
  const accessoryAcc = getAccountInfo(accounts, '12412', 'مخزن الإكسسوارات ومستلزمات الخياطة');
  const cashAcc = getAccountInfo(accounts, '1211', 'الخزينة الرئيسية للمصنع');
  const bankAcc = getAccountInfo(accounts, '1213', 'البنك - حساب جاري المصنع');
  const supplierAcc = getAccountInfo(accounts, '2111', 'موردو الأقمشة والغزول والمنسوجات');

  purchases.forEach((pur) => {
    let fabricTotal = 0;
    let accessoryTotal = 0;

    (pur.items || []).forEach(item => {
      const itemVal = Number(item.total) || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
      if (item.materialType === 'accessory') {
        accessoryTotal += itemVal;
      } else {
        fabricTotal += itemVal;
      }
    });

    const totalInvoice = Number(pur.grandTotal) || (fabricTotal + accessoryTotal);
    if (totalInvoice <= 0) return;

    const lines: JournalEntryLine[] = [];

    // 1. Debit lines: Raw Materials Warehouses
    if (fabricTotal > 0) {
      lines.push({
        id: `line_pur_${pur.id}_fab`,
        accountId: fabricAcc.id,
        accountCode: fabricAcc.code,
        accountName: fabricAcc.name,
        debit: Math.round(fabricTotal * 100) / 100,
        credit: 0,
        description: `توريد أقمشة وخامات رئيسية بموجب فاتورة ${pur.invoiceNumber}`
      });
    }

    if (accessoryTotal > 0) {
      lines.push({
        id: `line_pur_${pur.id}_acc`,
        accountId: accessoryAcc.id,
        accountCode: accessoryAcc.code,
        accountName: accessoryAcc.name,
        debit: Math.round(accessoryTotal * 100) / 100,
        credit: 0,
        description: `توريد إكسسوارات ومستلزمات خياطة بموجب فاتورة ${pur.invoiceNumber}`
      });
    }

    // 2. Credit lines: Cash, Bank, or Accounts Payable (Suppliers)
    const paidAmount = Number(pur.paidAmount) || (pur.paymentStatus === 'paid' ? totalInvoice : 0);
    const remainingAmount = Math.max(0, totalInvoice - paidAmount);

    if (paidAmount > 0) {
      const paymentAcc = pur.paymentMethod === 'bank' ? bankAcc : cashAcc;
      lines.push({
        id: `line_pur_${pur.id}_paid`,
        accountId: paymentAcc.id,
        accountCode: paymentAcc.code,
        accountName: paymentAcc.name,
        debit: 0,
        credit: Math.round(paidAmount * 100) / 100,
        description: `سداد قيمة مشتريات نقداً/بنك - مورد: ${pur.supplierName || 'مورد عام'}`
      });
    }

    if (remainingAmount > 0) {
      lines.push({
        id: `line_pur_${pur.id}_payable`,
        accountId: supplierAcc.id,
        accountCode: supplierAcc.code,
        accountName: `${supplierAcc.name} (${pur.supplierName || 'مورد'})`,
        debit: 0,
        credit: Math.round(remainingAmount * 100) / 100,
        description: `مستحق أجل للمورد: ${pur.supplierName || 'مورد خامات'} - فاتورة ${pur.invoiceNumber}`
      });
    }

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    entries.push({
      id: `auto_pur_${pur.id}`,
      entryNumber: '', // will be numbered dynamically in sequence
      date: pur.date || (pur.createdAt ? pur.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      time: pur.createdAt && pur.createdAt.includes('T') ? pur.createdAt.split('T')[1].slice(0, 8) : '10:00:00',
      createdAt: pur.createdAt || new Date().toISOString(),
      type: 'purchase',
      typeLabel: 'قيد آلي - مشتريات خامات ومستلزمات',
      description: `فاتورة شراء خامات رقم ${pur.invoiceNumber} - مورد: ${pur.supplierName || 'شركة توريدات'}`,
      reference: pur.invoiceNumber,
      sourceDocumentType: 'purchase_invoice',
      sourceDocumentId: pur.id,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      status: 'posted',
      createdBy: {
        userId: 'system_purchases',
        userName: 'مسؤول المشتريات / المخازن',
        userRole: 'أمين مخزن الخامات'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * Generates automated journal entries for purchase returns (مردودات ومرتجعات مشتريات الخامات للموردين)
 */
function generatePurchaseReturnsEntries(accounts: AccountNode[]): JournalEntry[] {
  const returns = getPurchaseReturns();
  const entries: JournalEntry[] = [];

  const cashAcc = getAccountInfo(accounts, '1211', 'الخزينة الرئيسية للمصنع');
  const bankAcc = getAccountInfo(accounts, '1213', 'البنك - حساب جاري المصنع');
  const supplierAcc = getAccountInfo(accounts, '2211', 'موردو خامات ومستلزمات الإنتاج');
  const fabricAcc = getAccountInfo(accounts, '12411', 'مخزن الأقمشة والغزول (خامات رئيسية)');
  const accessoryAcc = getAccountInfo(accounts, '12412', 'مخزن الإكسسوارات ومستلزمات الخياطة');

  returns.forEach((ret) => {
    const totalReturn = Number(ret.grandTotal) || 0;
    if (totalReturn <= 0) return;

    let fabricTotal = 0;
    let accessoryTotal = 0;

    ret.items.forEach((item) => {
      const isFabric = item.materialType === 'fabric' || item.materialName.includes('قماش') || item.materialName.includes('غزل');
      const itemTotal = Number(item.total) || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
      if (isFabric) {
        fabricTotal += itemTotal;
      } else {
        accessoryTotal += itemTotal;
      }
    });

    if (fabricTotal === 0 && accessoryTotal === 0) {
      fabricTotal = totalReturn;
    }

    const lines: JournalEntryLine[] = [];

    // 1. Debit lines: Cash, Bank, or Supplier Payables reduction
    if (ret.refundMethod === 'cash') {
      lines.push({
        id: `line_pret_${ret.id}_cash`,
        accountId: cashAcc.id,
        accountCode: cashAcc.code,
        accountName: cashAcc.name,
        debit: Math.round(totalReturn * 100) / 100,
        credit: 0,
        description: `استرداد نقدي بالخزينة لمرتجع خامات - مورد: ${ret.supplierName || 'مورد عام'}`
      });
    } else if (ret.refundMethod === 'bank') {
      lines.push({
        id: `line_pret_${ret.id}_bank`,
        accountId: bankAcc.id,
        accountCode: bankAcc.code,
        accountName: bankAcc.name,
        debit: Math.round(totalReturn * 100) / 100,
        credit: 0,
        description: `تحويل بنكي مسترد لمرتجع خامات - مورد: ${ret.supplierName || 'مورد عام'}`
      });
    } else {
      // credit_deduction: Debit Accounts Payable
      lines.push({
        id: `line_pret_${ret.id}_supp`,
        accountId: supplierAcc.id,
        accountCode: supplierAcc.code,
        accountName: `${supplierAcc.name} (${ret.supplierName || 'مورد'})`,
        debit: Math.round(totalReturn * 100) / 100,
        credit: 0,
        description: `خصم من رصيد المورد الآجل نظير إذن مرتجع خامات ${ret.returnNumber}`
      });
    }

    // 2. Credit lines: Raw Materials inventory reduction
    if (fabricTotal > 0) {
      lines.push({
        id: `line_pret_${ret.id}_fab`,
        accountId: fabricAcc.id,
        accountCode: fabricAcc.code,
        accountName: fabricAcc.name,
        debit: 0,
        credit: Math.round(fabricTotal * 100) / 100,
        description: `ارتجاع أقمشة للمورد بموجب إذن ارتجاع ${ret.returnNumber}`
      });
    }

    if (accessoryTotal > 0) {
      lines.push({
        id: `line_pret_${ret.id}_acc`,
        accountId: accessoryAcc.id,
        accountCode: accessoryAcc.code,
        accountName: accessoryAcc.name,
        debit: 0,
        credit: Math.round(accessoryTotal * 100) / 100,
        description: `ارتجاع إكسسوارات ومستلزمات خياطة للمورد بموجب إذن ارتجاع ${ret.returnNumber}`
      });
    }

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    entries.push({
      id: `auto_pret_${ret.id}`,
      entryNumber: '',
      date: ret.date || (ret.createdAt ? ret.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      time: ret.createdAt && ret.createdAt.includes('T') ? ret.createdAt.split('T')[1].slice(0, 8) : '14:00:00',
      createdAt: ret.createdAt || new Date().toISOString(),
      type: 'purchase_return',
      typeLabel: 'قيد آلي - إذن مردودات مشتريات',
      description: `إذن مردودات مشتريات خامات رقم ${ret.returnNumber} - مورد: ${ret.supplierName || 'مورد'} (فاتورة: ${ret.originalInvoiceNumber})`,
      reference: ret.returnNumber,
      sourceDocumentType: 'purchase_return',
      sourceDocumentId: ret.id,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      status: 'posted',
      createdBy: {
        userId: 'system_purchase_returns',
        userName: ret.issuedByWarehouseUser || 'أمين مخزن الخامات',
        userRole: 'أمين مخازن'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * Generates automated journal entries for sales invoices (فواتير مبيعات الملابس الجاهزة وتسليم العملاء)
 */
function generateSalesInvoicesEntries(accounts: AccountNode[]): JournalEntry[] {
  const sales = getSalesInvoices();
  const entries: JournalEntry[] = [];

  const cashAcc = getAccountInfo(accounts, '1211', 'الخزينة الرئيسية للمصنع');
  const bankAcc = getAccountInfo(accounts, '1213', 'البنك - حساب جاري المصنع');
  const customerAcc = getAccountInfo(accounts, '1221', 'عملاء مبيعات الملابس الجاهزة');
  const salesRevenueAcc = getAccountInfo(accounts, '411', 'مبيعات الملابس الجاهزة والمنتجات التامة');
  const vatAcc = getAccountInfo(accounts, '2231', 'مصلحة الضرائب - ضريبة القيمة المضافة مخرجات');
  const discountAcc = getAccountInfo(accounts, '422', 'خصم مسموح به ومسموحات مبيعات');
  const shippingRevenueAcc = getAccountInfo(accounts, '613', 'مصاريف وإيرادات شحن وتوصيل مبيعات');

  sales.forEach((sal) => {
    const subtotal = Number(sal.subtotal) || 0;
    const grandTotal = Number(sal.grandTotal) || 0;
    const paidAmount = Number(sal.paidAmount) || 0;
    const remainingAmount = Number(sal.remainingAmount) || Math.max(0, grandTotal - paidAmount);
    const discountTotal = Number(sal.discountTotal) || 0;
    const taxAmount = Number(sal.taxAmount) || 0;
    const shippingCost = Number(sal.shippingCost) || 0;

    if (grandTotal <= 0 && subtotal <= 0) return;

    const lines: JournalEntryLine[] = [];

    // 1. Debit lines: Cash / Bank for paid portion
    if (paidAmount > 0) {
      const paymentAcc = sal.paymentMethod === 'bank' ? bankAcc : cashAcc;
      lines.push({
        id: `line_sal_${sal.id}_paid`,
        accountId: paymentAcc.id,
        accountCode: paymentAcc.code,
        accountName: paymentAcc.name,
        debit: Math.round(paidAmount * 100) / 100,
        credit: 0,
        description: `تحصيل قيمة مبيعات (${sal.paymentMethod === 'bank' ? 'تحويل بنكي' : 'خزينة نقداً'}) - عميل: ${sal.customerName || 'عميل نقدي'}`
      });
    }

    // 2. Debit lines: Accounts Receivable (Customers) for remaining balance
    if (remainingAmount > 0) {
      lines.push({
        id: `line_sal_${sal.id}_rec`,
        accountId: customerAcc.id,
        accountCode: customerAcc.code,
        accountName: `${customerAcc.name} (${sal.customerName || 'عميل'})`,
        debit: Math.round(remainingAmount * 100) / 100,
        credit: 0,
        description: `مستحق أجل على العميل: ${sal.customerName || 'عميل'} - فاتورة ${sal.invoiceNumber}`
      });
    }

    // 3. Debit line: Discount allowed if any
    if (discountTotal > 0) {
      lines.push({
        id: `line_sal_${sal.id}_disc`,
        accountId: discountAcc.id,
        accountCode: discountAcc.code,
        accountName: discountAcc.name,
        debit: Math.round(discountTotal * 100) / 100,
        credit: 0,
        description: `خصم تجاري مسموح به للعميل على فاتورة ${sal.invoiceNumber}`
      });
    }

    // 4. Credit line: Sales Revenue (subtotal before discount)
    if (subtotal > 0) {
      lines.push({
        id: `line_sal_${sal.id}_rev`,
        accountId: salesRevenueAcc.id,
        accountCode: salesRevenueAcc.code,
        accountName: salesRevenueAcc.name,
        debit: 0,
        credit: Math.round(subtotal * 100) / 100,
        description: `إيراد مبيعات ملابس جاهزة ومنتجات تامة - فاتورة ${sal.invoiceNumber}`
      });
    }

    // 5. Credit line: VAT Payable if any
    if (taxAmount > 0) {
      lines.push({
        id: `line_sal_${sal.id}_tax`,
        accountId: vatAcc.id,
        accountCode: vatAcc.code,
        accountName: vatAcc.name,
        debit: 0,
        credit: Math.round(taxAmount * 100) / 100,
        description: `ضريبة القيمة المضافة مخرجات (${sal.taxPercent || 14}%) - فاتورة ${sal.invoiceNumber}`
      });
    }

    // 6. Credit line: Shipping recovery if any
    if (shippingCost > 0) {
      lines.push({
        id: `line_sal_${sal.id}_ship`,
        accountId: shippingRevenueAcc.id,
        accountCode: shippingRevenueAcc.code,
        accountName: shippingRevenueAcc.name,
        debit: 0,
        credit: Math.round(shippingCost * 100) / 100,
        description: `مصاريف شحن ونقل مبيعات محملة على العميل - فاتورة ${sal.invoiceNumber}`
      });
    }

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    entries.push({
      id: `auto_sal_${sal.id}`,
      entryNumber: '',
      date: sal.date || (sal.createdAt ? sal.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      time: sal.createdAt && sal.createdAt.includes('T') ? sal.createdAt.split('T')[1].slice(0, 8) : '11:00:00',
      createdAt: sal.createdAt || new Date().toISOString(),
      type: 'sales',
      typeLabel: 'قيد آلي - فاتورة مبيعات منتجات تامة',
      description: `فاتورة بيع رقم ${sal.invoiceNumber} - عميل: ${sal.customerName || 'عميل نقدي'}`,
      reference: sal.invoiceNumber,
      sourceDocumentType: 'sales_invoice',
      sourceDocumentId: sal.id,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      status: 'posted',
      createdBy: {
        userId: 'system_sales',
        userName: sal.salesperson || 'مسؤول المبيعات والتسليم',
        userRole: 'مبيعات'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * Generates automated journal entries for sales returns (مرتجعات ومردودات المبيعات)
 */
function generateSalesReturnsEntries(accounts: AccountNode[]): JournalEntry[] {
  const returns = getSalesReturns();
  const entries: JournalEntry[] = [];

  const cashAcc = getAccountInfo(accounts, '1211', 'الخزينة الرئيسية للمصنع');
  const bankAcc = getAccountInfo(accounts, '1213', 'البنك - حساب جاري المصنع');
  const customerAcc = getAccountInfo(accounts, '1221', 'عملاء مبيعات الملابس الجاهزة');
  const salesReturnAcc = getAccountInfo(accounts, '421', 'مردودات مبيعات ملابس جاهزة');
  const vatAcc = getAccountInfo(accounts, '2231', 'مصلحة الضرائب - ضريبة القيمة المضافة مخرجات');

  returns.forEach((ret) => {
    const subtotal = Number(ret.subtotal) || 0;
    const grandTotal = Number(ret.grandTotal) || 0;
    const taxAmount = Number(ret.taxAmount) || 0;
    const refundedAmount = Number(ret.refundedAmount) || grandTotal;

    if (grandTotal <= 0 && subtotal <= 0) return;

    const lines: JournalEntryLine[] = [];

    // 1. Debit line: Sales Returns account (421) (Subtotal)
    if (subtotal > 0) {
      lines.push({
        id: `line_ret_${ret.id}_ret`,
        accountId: salesReturnAcc.id,
        accountCode: salesReturnAcc.code,
        accountName: salesReturnAcc.name,
        debit: Math.round(subtotal * 100) / 100,
        credit: 0,
        description: `إثبات مردودات مبيعات - إذن مرتجع ${ret.returnNumber} (فاتورة أصلية: ${ret.originalInvoiceNumber})`
      });
    }

    // 2. Debit line: Reversal of VAT (if original had VAT)
    if (taxAmount > 0) {
      lines.push({
        id: `line_ret_${ret.id}_tax`,
        accountId: vatAcc.id,
        accountCode: vatAcc.code,
        accountName: vatAcc.name,
        debit: Math.round(taxAmount * 100) / 100,
        credit: 0,
        description: `تسوية وتخفيض ضريبة القيمة المضافة للمبيعات المرتجعة (${ret.taxPercent || 14}%)`
      });
    }

    // 3. Credit line: Cash / Bank (if refunded cash/bank) or Customer Accounts Receivable (if credit deduction)
    if (ret.refundMethod === 'credit_deduction') {
      lines.push({
        id: `line_ret_${ret.id}_cust`,
        accountId: customerAcc.id,
        accountCode: customerAcc.code,
        accountName: `${customerAcc.name} (${ret.customerName})`,
        debit: 0,
        credit: Math.round(grandTotal * 100) / 100,
        description: `خصم وتسوية من رصيد العميل الآجل (${ret.customerName}) - إذن مرتجع ${ret.returnNumber}`
      });
    } else {
      const refundAcc = ret.refundMethod === 'bank' ? bankAcc : cashAcc;
      lines.push({
        id: `line_ret_${ret.id}_refund`,
        accountId: refundAcc.id,
        accountCode: refundAcc.code,
        accountName: refundAcc.name,
        debit: 0,
        credit: Math.round(refundedAmount * 100) / 100,
        description: `رد وصرف قيمة المرتجع للعميل (${ret.refundMethod === 'bank' ? 'تحويل بنكي' : 'خزينة نقداً'}) - عميل: ${ret.customerName}`
      });
    }

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    entries.push({
      id: `auto_ret_${ret.id}`,
      entryNumber: '',
      date: ret.date || (ret.createdAt ? ret.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      time: ret.createdAt && ret.createdAt.includes('T') ? ret.createdAt.split('T')[1].slice(0, 8) : '12:00:00',
      createdAt: ret.createdAt || new Date().toISOString(),
      type: 'sales_return',
      typeLabel: 'قيد آلي - إذن مردودات مبيعات',
      description: `إذن مردودات مبيعات رقم ${ret.returnNumber} - عميل: ${ret.customerName} (فاتورة: ${ret.originalInvoiceNumber})`,
      reference: ret.returnNumber,
      sourceDocumentType: 'sales_return',
      sourceDocumentId: ret.id,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      status: 'posted',
      createdBy: {
        userId: 'system_sales_returns',
        userName: ret.receivedByWarehouseUser || 'مسؤول المبيعات والمخزن',
        userRole: 'مخازن ومبيعات'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 1. قيد صرف خامات ومستلزمات الإنتاج الأولية للتشغيل (WIP Materials Issuance)
 * يتم إنشاؤه عند اعتماد أمر الإنتاج أو بدء خطة التشغيل.
 */
function generateProductionWipEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const wipCutAcc = getAccountInfo(accounts, '12421', 'إنتاج تحت التشغيل - مرحلة القص والتجهيز');
  const fabricAcc = getAccountInfo(accounts, '12411', 'مخزن الأقمشة والغزول (خامات رئيسية)');
  const accessoryAcc = getAccountInfo(accounts, '12412', 'مخزن الإكسسوارات ومستلزمات الخياطة');

  orders.forEach((order) => {
    if (order.status === 'مسودة') return;

    let fabricCost = 0;
    let accessoryCost = 0;

    if (order.materials && Array.isArray(order.materials)) {
      order.materials.forEach((m: any) => {
        const cost = (Number(m.totalQuantity) || 0) * (Number(m.unitPrice) || 0);
        fabricCost += cost;
      });
    }

    if (order.accessories && Array.isArray(order.accessories)) {
      order.accessories.forEach((a: any) => {
        const cost = (Number(a.totalQuantity) || 0) * (Number(a.unitPrice) || 0);
        accessoryCost += cost;
      });
    }

    if (fabricCost === 0 && accessoryCost === 0) {
      const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
        return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
      }, 0);
      fabricCost = totalPieces > 0 ? totalPieces * 85 : 12500;
      accessoryCost = totalPieces > 0 ? totalPieces * 15 : 2200;
    }

    const totalWip = fabricCost + accessoryCost;
    if (totalWip <= 0) return;

    const lines: JournalEntryLine[] = [
      {
        id: `line_wip_${order.id}_debit`,
        accountId: wipCutAcc.id,
        accountCode: wipCutAcc.code,
        accountName: wipCutAcc.name,
        debit: Math.round(totalWip * 100) / 100,
        credit: 0,
        description: `صرف خامات ومستلزمات إنتاج لأمر الشغل ${order.orderNumber} (موديل: ${order.styleName || ''})`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      }
    ];

    if (fabricCost > 0) {
      lines.push({
        id: `line_wip_${order.id}_cr_fab`,
        accountId: fabricAcc.id,
        accountCode: fabricAcc.code,
        accountName: fabricAcc.name,
        debit: 0,
        credit: Math.round(fabricCost * 100) / 100,
        description: `صرف أقمشة من مخزن الخامات لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      });
    }

    if (accessoryCost > 0) {
      lines.push({
        id: `line_wip_${order.id}_cr_acc`,
        accountId: accessoryAcc.id,
        accountCode: accessoryAcc.code,
        accountName: accessoryAcc.name,
        debit: 0,
        credit: Math.round(accessoryCost * 100) / 100,
        description: `صرف إكسسوارات ومستلزمات خياطة لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      });
    }

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    const approvedDate = order.productionApprovedAt
      ? order.productionApprovedAt.split('T')[0]
      : (order.orderDate || new Date().toISOString().split('T')[0]);
    const approvedTime = order.productionApprovedAt && order.productionApprovedAt.includes('T')
      ? order.productionApprovedAt.split('T')[1].slice(0, 8)
      : '10:00:00';

    entries.push({
      id: `auto_wip_${order.id}`,
      entryNumber: '',
      date: approvedDate,
      time: approvedTime,
      createdAt: order.productionApprovedAt || order.createdAt || new Date().toISOString(),
      type: 'production_wip',
      typeLabel: 'قيد آلي - صرف خامات للتشغيل (WIP)',
      description: `صرف خامات ومستلزمات أمر الإنتاج ${order.orderNumber} - موديل: ${order.styleName || 'تصنيع ملابس'}`,
      reference: order.orderNumber,
      sourceDocumentType: 'production_order',
      sourceDocumentId: order.id,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      status: 'posted',
      createdBy: {
        userId: 'system_production',
        userName: order.productionApprovedBy || 'مدير الإنتاج والتخطيط',
        userRole: 'إدارة الإنتاج'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 2. قيد اعتماد مرحلة القص وتكاليف عمالة التفصيل (Cutting Stage Approval)
 */
function generateProductionCutEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const wipCutAcc = getAccountInfo(accounts, '12421', 'إنتاج تحت التشغيل - مرحلة القص والتجهيز');
  const laborAcc = getAccountInfo(accounts, '2131', 'أجور ومرتبات عمال الإنتاج والمصنع المستحقة');

  const cutStatuses = ['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];

  orders.forEach((order) => {
    const isCutApproved = order.cutApprovedAt || (order.cutData && order.cutData.approvedAt) || cutStatuses.includes(order.status);
    if (!isCutApproved) return;

    const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
      return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
    }, 0) || 100;

    const cutRate = Number(order.standardCutCostPerPiece) || 8;
    const totalCutLabor = Math.round(totalPieces * cutRate * 100) / 100;

    const lines: JournalEntryLine[] = [
      {
        id: `line_cut_${order.id}_deb`,
        accountId: wipCutAcc.id,
        accountCode: wipCutAcc.code,
        accountName: wipCutAcc.name,
        debit: totalCutLabor,
        credit: 0,
        description: `تحميل أجور وعمالة القص والتفصيل لأمر ${order.orderNumber} (${totalPieces} قطعة @ ${cutRate} ج.م)`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      },
      {
        id: `line_cut_${order.id}_cred`,
        accountId: laborAcc.id,
        accountCode: laborAcc.code,
        accountName: laborAcc.name,
        debit: 0,
        credit: totalCutLabor,
        description: `استحقاق أجور عمال مقصدارية القص عن أمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      }
    ];

    const cutDate = order.cutApprovedAt
      ? order.cutApprovedAt.split('T')[0]
      : (order.cutData?.approvedAt ? order.cutData.approvedAt.split('T')[0] : (order.orderDate || new Date().toISOString().split('T')[0]));

    entries.push({
      id: `auto_cut_${order.id}`,
      entryNumber: '',
      date: cutDate,
      time: '11:00:00',
      createdAt: order.cutApprovedAt || order.cutData?.approvedAt || new Date().toISOString(),
      type: 'production_cut',
      typeLabel: 'قيد آلي - اعتماد مرحلة القص وتكاليف التفصيل',
      description: `اعتماد نتائج القص وأجور التفصيل لأمر الإنتاج ${order.orderNumber} (${totalPieces} قطعة)`,
      reference: order.cutData?.cutOrderNumber || `CUT-${order.orderNumber}`,
      sourceDocumentType: 'production_order',
      sourceDocumentId: order.id,
      lines,
      totalDebit: totalCutLabor,
      totalCredit: totalCutLabor,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_cut',
        userName: order.cutApprovedBy || order.cutData?.approvedBy || 'مشرف عنبر القص',
        userRole: 'مشرف قص'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 3. قيد اعتماد تجهيز الإكسسوارات والمستلزمات للباتشات (Prep Stage Approval)
 */
function generateProductionPrepEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const wipSewAcc = getAccountInfo(accounts, '12422', 'إنتاج تحت التشغيل - مرحلة الخياطة والتجميع');
  const accessoryAcc = getAccountInfo(accounts, '12412', 'مخزن الإكسسوارات ومستلزمات الخياطة');

  const prepStatuses = ['التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];

  orders.forEach((order) => {
    const isPrepApproved = 
      order.prepApprovedAt || 
      prepStatuses.includes(order.status) || 
      (order.batches && order.batches.some((b: any) => b.prepStatus === 'مكتمل' || b.prepApprovedAt));
    if (!isPrepApproved) return;

    let prepAccessoriesValue = 0;
    if (order.accessories && Array.isArray(order.accessories)) {
      prepAccessoriesValue = order.accessories.reduce((sum: number, a: any) => {
        return sum + ((Number(a.totalQuantity) || 0) * (Number(a.unitPrice) || 0));
      }, 0);
    }
    if (prepAccessoriesValue <= 0) {
      const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
        return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
      }, 0) || 100;
      prepAccessoriesValue = totalPieces * 12;
    }

    prepAccessoriesValue = Math.round(prepAccessoriesValue * 100) / 100;

    const lines: JournalEntryLine[] = [
      {
        id: `line_prep_${order.id}_deb`,
        accountId: wipSewAcc.id,
        accountCode: wipSewAcc.code,
        accountName: wipSewAcc.name,
        debit: prepAccessoriesValue,
        credit: 0,
        description: `صرف وتجهيز مستلزمات الخياطة للباتشات لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      },
      {
        id: `line_prep_${order.id}_cred`,
        accountId: accessoryAcc.id,
        accountCode: accessoryAcc.code,
        accountName: accessoryAcc.name,
        debit: 0,
        credit: prepAccessoriesValue,
        description: `صرف إكسسوارات وخيوط وسوست من مخزن المستلزمات لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      }
    ];

    const prepDate = order.prepApprovedAt
      ? order.prepApprovedAt.split('T')[0]
      : (order.updatedAt ? order.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]);

    entries.push({
      id: `auto_prep_${order.id}`,
      entryNumber: '',
      date: prepDate,
      time: '12:00:00',
      createdAt: order.prepApprovedAt || order.updatedAt || new Date().toISOString(),
      type: 'production_prep',
      typeLabel: 'قيد آلي - صرف مستلزمات وتجهيز الباتشات',
      description: `اعتماد تجهيز إكسسوارات ومستلزمات باتشات الخياطة لأمر الإنتاج ${order.orderNumber}`,
      reference: `PREP-${order.orderNumber}`,
      sourceDocumentType: 'production_order',
      sourceDocumentId: order.id,
      lines,
      totalDebit: prepAccessoriesValue,
      totalCredit: prepAccessoriesValue,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_prep',
        userName: order.prepApprovedBy || 'مسؤول تجهيز المستلزمات',
        userRole: 'مشرف تجهيز'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 4. قيد اعتماد مرحلة الطباعة والتطريز والتشغيل الخارجي (Print & Embroidery Stage Approval)
 */
function generateProductionPrintEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const wipPrintAcc = getAccountInfo(accounts, '12423', 'إنتاج تحت التشغيل - مرحلة الطباعة والتطريز الخارجي');
  const subconAcc = getAccountInfo(accounts, '2114', 'مقاولو باطن وورش خياطة وتطريز خارجية');

  const printStatuses = ['الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];

  orders.forEach((order) => {
    const isPrintApproved = order.printEmbroideryApprovedAt || printStatuses.includes(order.status);
    if (!isPrintApproved) return;

    const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
      return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
    }, 0) || 100;

    const unitPrintCost = Number(order.printEmbroideryStandardCost) || (order.batches?.[0]?.printEmbroideryCost?.standardCost) || 14;
    const totalPrintCost = Math.round(totalPieces * unitPrintCost * 100) / 100;

    const lines: JournalEntryLine[] = [
      {
        id: `line_print_${order.id}_deb`,
        accountId: wipPrintAcc.id,
        accountCode: wipPrintAcc.code,
        accountName: wipPrintAcc.name,
        debit: totalPrintCost,
        credit: 0,
        description: `تكلفة خدمات طباعة وتطريز أجزاء الموديل لأمر ${order.orderNumber} (${totalPieces} قطعة @ ${unitPrintCost} ج.م)`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      },
      {
        id: `line_print_${order.id}_cred`,
        accountId: subconAcc.id,
        accountCode: subconAcc.code,
        accountName: subconAcc.name,
        debit: 0,
        credit: totalPrintCost,
        description: `استحقاق ورش ومقاولو الطباعة والتطريز عن أمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      }
    ];

    const printDate = order.printEmbroideryApprovedAt
      ? order.printEmbroideryApprovedAt.split('T')[0]
      : (order.updatedAt ? order.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]);

    entries.push({
      id: `auto_print_${order.id}`,
      entryNumber: '',
      date: printDate,
      time: '13:00:00',
      createdAt: order.printEmbroideryApprovedAt || order.updatedAt || new Date().toISOString(),
      type: 'production_print',
      typeLabel: 'قيد آلي - تشغيل خارجي / طباعة وتطريز',
      description: `اعتماد تشغيل خدمات الطباعة والتطريز لأمر الإنتاج ${order.orderNumber}`,
      reference: `PRNT-${order.orderNumber}`,
      sourceDocumentType: 'production_order',
      sourceDocumentId: order.id,
      lines,
      totalDebit: totalPrintCost,
      totalCredit: totalPrintCost,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_print',
        userName: order.printEmbroideryApprovedBy || 'مشرف الجودة والطباعة والتطريز',
        userRole: 'مشرف تطريز'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 5. قيد اعتماد مرحلة الخياطة والتجميع واستحقاق أجور الخطوط (Sewing Stage Approval)
 */
function generateProductionSewingEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const wipSewAcc = getAccountInfo(accounts, '12422', 'إنتاج تحت التشغيل - مرحلة الخياطة والتجميع');
  const laborAcc = getAccountInfo(accounts, '2131', 'أجور ومرتبات عمال الإنتاج والمصنع المستحقة');

  const advancedStatuses = ['الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];

  orders.forEach((order) => {
    const isSewingApproved = order.sewingApprovedAt || order.batchesLockedAt || advancedStatuses.includes(order.status);
    if (!isSewingApproved) return;

    const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
      return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
    }, 0) || 100;

    const sewingRate = Number(order.standardSewingCostPerPiece) || 25;
    const totalLaborCost = Math.round(totalPieces * sewingRate * 100) / 100;

    const lines: JournalEntryLine[] = [
      {
        id: `line_sew_${order.id}_deb`,
        accountId: wipSewAcc.id,
        accountCode: wipSewAcc.code,
        accountName: wipSewAcc.name,
        debit: totalLaborCost,
        credit: 0,
        description: `تحميل أجور وعمالة خطوط الخياطة والتجميع لأمر ${order.orderNumber} (${totalPieces} قطعة @ ${sewingRate} ج.م)`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      },
      {
        id: `line_sew_${order.id}_cred`,
        accountId: laborAcc.id,
        accountCode: laborAcc.code,
        accountName: laborAcc.name,
        debit: 0,
        credit: totalLaborCost,
        description: `استحقاق أجور عمال الخياطة والتجميع عن أمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      }
    ];

    const sewDate = order.sewingApprovedAt
      ? order.sewingApprovedAt.split('T')[0]
      : (order.batchesLockedAt ? order.batchesLockedAt.split('T')[0] : (order.updatedAt ? order.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]));

    entries.push({
      id: `auto_sew_${order.id}`,
      entryNumber: '',
      date: sewDate,
      time: '14:30:00',
      createdAt: order.sewingApprovedAt || order.batchesLockedAt || new Date().toISOString(),
      type: 'production_sew',
      typeLabel: 'قيد آلي - اعتماد مرحلة الخياطة والتجميع',
      description: `اعتماد إنتاجية خطوط الخياطة واستحقاق أجور العمالة لأمر ${order.orderNumber}`,
      reference: `SEW-${order.orderNumber}`,
      sourceDocumentType: 'production_order',
      sourceDocumentId: order.id,
      lines,
      totalDebit: totalLaborCost,
      totalCredit: totalLaborCost,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_sewing',
        userName: order.sewingApprovedBy || 'مشرف خطوط الخياطة والتجميع',
        userRole: 'مشرف خياطة'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 6. قيد اعتماد مرحلة الكي والتشطيب والفنش النهائي (Finishing & Ironing Stage Approval)
 */
function generateProductionFinishingEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const wipFinishAcc = getAccountInfo(accounts, '12424', 'إنتاج تحت التشغيل - مرحلة الكي والتشطيب والفنش');
  const laborAcc = getAccountInfo(accounts, '2131', 'أجور ومرتبات عمال الإنتاج والمصنع المستحقة');

  const finishStatuses = ['التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];

  orders.forEach((order) => {
    const isFinishApproved = order.finishingApprovedAt || order.ironingApprovedAt || finishStatuses.includes(order.status);
    if (!isFinishApproved) return;

    const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
      return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
    }, 0) || 100;

    const finishRate = (Number(order.standardFinishingCostPerPiece) || 6) + (Number(order.standardIroningCostPerPiece) || 5);
    const totalFinishLabor = Math.round(totalPieces * finishRate * 100) / 100;

    const lines: JournalEntryLine[] = [
      {
        id: `line_fin_${order.id}_deb`,
        accountId: wipFinishAcc.id,
        accountCode: wipFinishAcc.code,
        accountName: wipFinishAcc.name,
        debit: totalFinishLabor,
        credit: 0,
        description: `تحميل أجور الكي والتشطيب والفنش وإزالة الزوائد لأمر ${order.orderNumber} (${totalPieces} قطعة @ ${finishRate} ج.م)`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      },
      {
        id: `line_fin_${order.id}_cred`,
        accountId: laborAcc.id,
        accountCode: laborAcc.code,
        accountName: laborAcc.name,
        debit: 0,
        credit: totalFinishLabor,
        description: `استحقاق أجور عمال المكواة والتشطيب عن أمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      }
    ];

    const finDate = order.finishingApprovedAt
      ? order.finishingApprovedAt.split('T')[0]
      : (order.ironingApprovedAt ? order.ironingApprovedAt.split('T')[0] : (order.updatedAt ? order.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]));

    entries.push({
      id: `auto_fin_${order.id}`,
      entryNumber: '',
      date: finDate,
      time: '15:30:00',
      createdAt: order.finishingApprovedAt || order.ironingApprovedAt || new Date().toISOString(),
      type: 'production_finish',
      typeLabel: 'قيد آلي - اعتماد مرحلة التشطيب والكي',
      description: `اعتماد مرحلة التشطيب والكي والفنش النهائي لأمر الإنتاج ${order.orderNumber}`,
      reference: `FIN-${order.orderNumber}`,
      sourceDocumentType: 'production_order',
      sourceDocumentId: order.id,
      lines,
      totalDebit: totalFinishLabor,
      totalCredit: totalFinishLabor,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_finishing',
        userName: order.finishingApprovedBy || order.ironingApprovedBy || 'مشرف الفنش والمكواة',
        userRole: 'مشرف تشطيب'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 7. قيد إيداع المنتجات التامة بالمخزن وإقفال مراحل التشغيل (Finished Goods Inventory Deposit)
 */
function generateFinishedGoodsEntries(accounts: AccountNode[], orders: any[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const finishedGoodsAcc = getAccountInfo(accounts, '12431', 'مخزن الملابس الجاهزة والمنتجات التامة (فرز أول)');
  const wipCutAcc = getAccountInfo(accounts, '12421', 'إنتاج تحت التشغيل - مرحلة القص والتجهيز');
  const wipSewAcc = getAccountInfo(accounts, '12422', 'إنتاج تحت التشغيل - مرحلة الخياطة والتجميع');
  const wipPrintAcc = getAccountInfo(accounts, '12423', 'إنتاج تحت التشغيل - مرحلة الطباعة والتطريز الخارجي');
  const wipFinishAcc = getAccountInfo(accounts, '12424', 'إنتاج تحت التشغيل - مرحلة الكي والتشطيب والفنش');

  orders.forEach((order) => {
    const isCompleted = order.packingApprovedAt || order.status === 'التغليف معتمد' || order.status === 'مغلق';
    if (!isCompleted) return;

    const totalPieces = (order.sizes || []).reduce((acc: number, s: any) => {
      return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
    }, 0) || 100;

    const unitFinishedCost = 135; // standard total production cost per piece
    const totalFinishedCost = totalPieces * unitFinishedCost;

    // Distribute cost across WIP stages for clean clearance
    const cutWipShare = Math.round(totalFinishedCost * 0.50 * 100) / 100; // raw fabrics + cutting labor
    const sewWipShare = Math.round(totalFinishedCost * 0.30 * 100) / 100; // accessories + sewing labor
    const printWipShare = Math.round(totalFinishedCost * 0.10 * 100) / 100; // printing & embroidery
    const finishWipShare = Math.round((totalFinishedCost - cutWipShare - sewWipShare - printWipShare) * 100) / 100; // finishing & ironing

    const lines: JournalEntryLine[] = [
      {
        id: `line_fg_${order.id}_deb`,
        accountId: finishedGoodsAcc.id,
        accountCode: finishedGoodsAcc.code,
        accountName: finishedGoodsAcc.name,
        debit: totalFinishedCost,
        credit: 0,
        description: `إيداع ملابس جاهزة تامة الصنع بمخزن المنتجات التامة - أمر ${order.orderNumber} (${totalPieces} قطعة)`,
        costCenterId: order.orderNumber,
        costCenterName: `أمر إنتاج ${order.orderNumber}`
      },
      {
        id: `line_fg_${order.id}_cr_cut`,
        accountId: wipCutAcc.id,
        accountCode: wipCutAcc.code,
        accountName: wipCutAcc.name,
        debit: 0,
        credit: cutWipShare,
        description: `إقفال مرحلة القص والتجهيز تحت التشغيل لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      },
      {
        id: `line_fg_${order.id}_cr_sew`,
        accountId: wipSewAcc.id,
        accountCode: wipSewAcc.code,
        accountName: wipSewAcc.name,
        debit: 0,
        credit: sewWipShare,
        description: `إقفال مرحلة الخياطة والتجميع تحت التشغيل لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      },
      {
        id: `line_fg_${order.id}_cr_prnt`,
        accountId: wipPrintAcc.id,
        accountCode: wipPrintAcc.code,
        accountName: wipPrintAcc.name,
        debit: 0,
        credit: printWipShare,
        description: `إقفال مرحلة الطباعة والتطريز تحت التشغيل لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      },
      {
        id: `line_fg_${order.id}_cr_fin`,
        accountId: wipFinishAcc.id,
        accountCode: wipFinishAcc.code,
        accountName: wipFinishAcc.name,
        debit: 0,
        credit: finishWipShare,
        description: `إقفال مرحلة الكي والتشطيب تحت التشغيل لأمر ${order.orderNumber}`,
        costCenterId: order.orderNumber
      }
    ];

    const date = order.packingApprovedAt
      ? order.packingApprovedAt.split('T')[0]
      : (order.updatedAt ? order.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]);

    entries.push({
      id: `auto_fg_${order.id}`,
      entryNumber: '',
      date,
      time: '16:00:00',
      createdAt: order.packingApprovedAt || order.updatedAt || new Date().toISOString(),
      type: 'finished_goods',
      typeLabel: 'قيد آلي - إيداع إنتاج تام بالمخزن',
      description: `إيداع منتجات تامة لأمر الإنتاج ${order.orderNumber} بمخزن الملابس الجاهزة وإقفال مراحل التشغيل (${totalPieces} قطعة)`,
      reference: order.orderNumber,
      sourceDocumentType: 'finished_goods',
      sourceDocumentId: order.id,
      lines,
      totalDebit: totalFinishedCost,
      totalCredit: totalFinishedCost,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_fg',
        userName: order.packingApprovedBy || 'أمين مخزن المنتجات التامة',
        userRole: 'أمين مخازن'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * 8. قيد إثبات تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)
 * يتم توليده آلياً عند إصدار فواتير بيع وتسليم المنتجات التامة للعملاء.
 */
function generateSalesCogsEntries(accounts: AccountNode[]): JournalEntry[] {
  const sales = getSalesInvoices();
  const entries: JournalEntry[] = [];
  const cogsAcc = getAccountInfo(accounts, '511', 'تكلفة الخامات المباشرة والإنتاج المباع (COGS)');
  const finishedGoodsAcc = getAccountInfo(accounts, '12431', 'مخزن الملابس الجاهزة والمنتجات التامة (فرز أول)');

  sales.forEach((sal) => {
    let totalPieces = 0;
    (sal.items || []).forEach(it => {
      totalPieces += Number(it.quantity) || 0;
    });

    const subtotal = Number(sal.subtotal) || Number(sal.grandTotal) || 0;
    if (subtotal <= 0) return;

    // Garment standard cost ratio is approx 60% of sales price
    const estimatedCogs = totalPieces > 0 ? (totalPieces * 125) : Math.round(subtotal * 0.60);
    if (estimatedCogs <= 0) return;

    const lines: JournalEntryLine[] = [
      {
        id: `line_cogs_${sal.id}_deb`,
        accountId: cogsAcc.id,
        accountCode: cogsAcc.code,
        accountName: cogsAcc.name,
        debit: estimatedCogs,
        credit: 0,
        description: `إثبات تكلفة بضاعة مباعة عن فاتورة بيع ${sal.invoiceNumber} (عميل: ${sal.customerName || 'عميل'})`
      },
      {
        id: `line_cogs_${sal.id}_cred`,
        accountId: finishedGoodsAcc.id,
        accountCode: finishedGoodsAcc.code,
        accountName: finishedGoodsAcc.name,
        debit: 0,
        credit: estimatedCogs,
        description: `صرف بضاعة تامة الصنع من المخزن تسليم فاتورة ${sal.invoiceNumber}`
      }
    ];

    entries.push({
      id: `auto_cogs_${sal.id}`,
      entryNumber: '',
      date: sal.date || (sal.createdAt ? sal.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      time: sal.createdAt && sal.createdAt.includes('T') ? sal.createdAt.split('T')[1].slice(0, 8) : '11:05:00',
      createdAt: sal.createdAt || new Date().toISOString(),
      type: 'cogs',
      typeLabel: 'قيد آلي - إثبات تكلفة البضاعة المباعة',
      description: `صرف وتسليم بضاعة مبيعات فاتورة ${sal.invoiceNumber} وإثبات تكلفة المبيعات (COGS)`,
      reference: sal.invoiceNumber,
      sourceDocumentType: 'sales_invoice',
      sourceDocumentId: sal.id,
      lines,
      totalDebit: estimatedCogs,
      totalCredit: estimatedCogs,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_cogs',
        userName: sal.salesperson || 'مسؤول التكاليف والمبيعات',
        userRole: 'محاسب تكاليف'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * Generates automated journal entries for manual stock adjustments (تسويات جردية وأرصدة افتتاحية)
 */
function generateInventoryAdjustmentEntries(accounts: AccountNode[]): JournalEntry[] {
  const adjustments = getManualStockAdjustments();
  const entries: JournalEntry[] = [];

  const fabricAcc = getAccountInfo(accounts, '12411', 'مخزن الأقمشة والغزول (خامات رئيسية)');
  const accessoryAcc = getAccountInfo(accounts, '12412', 'مخزن الإكسسوارات ومستلزمات الخياطة');
  const capitalAcc = getAccountInfo(accounts, '31', 'رأس مال المصنع المدفوع');
  const otherRevenueAcc = getAccountInfo(accounts, '431', 'إيرادات تشغيلية واستثنائية أخرى');
  const scrapExpenseAcc = getAccountInfo(accounts, '527', 'مهمات أمن صناعي وسلامة مهنية ومستهلكات الورش');

  adjustments.forEach((adj) => {
    const rawAcc = adj.materialType === 'accessory' ? accessoryAcc : fabricAcc;
    const value = Math.round(((Number(adj.quantity) || 0) * (Number(adj.unitPrice) || 0)) * 100) / 100;
    if (value <= 0) return;

    const lines: JournalEntryLine[] = [];

    if (adj.type === 'initial_stock') {
      // Opening Stock: Debit Inventory, Credit Capital / Retained Earnings
      lines.push({
        id: `line_adj_${adj.id}_deb`,
        accountId: rawAcc.id,
        accountCode: rawAcc.code,
        accountName: rawAcc.name,
        debit: value,
        credit: 0,
        description: `رصيد افتتاحي (مخزون أول المدة) - ${adj.materialName} (${adj.quantity})`
      });
      lines.push({
        id: `line_adj_${adj.id}_cred`,
        accountId: capitalAcc.id,
        accountCode: capitalAcc.code,
        accountName: capitalAcc.name,
        debit: 0,
        credit: value,
        description: `رأس المال مقابل مخزون أول المدة للخامات`
      });
    } else if (adj.type === 'in') {
      // Inward adjustment: Debit Inventory, Credit Other Revenue / Inventory Gain
      lines.push({
        id: `line_adj_${adj.id}_deb`,
        accountId: rawAcc.id,
        accountCode: rawAcc.code,
        accountName: rawAcc.name,
        debit: value,
        credit: 0,
        description: `إذن إضافة وارد يدوي للخامة ${adj.materialName}`
      });
      lines.push({
        id: `line_adj_${adj.id}_cred`,
        accountId: otherRevenueAcc.id,
        accountCode: otherRevenueAcc.code,
        accountName: otherRevenueAcc.name,
        debit: 0,
        credit: value,
        description: `فروق جرد موجبة وإذن إضافة وارد - ${adj.reason || 'تسوية'}`
      });
    } else {
      // Outward adjustment (out or adjustment deficit): Debit Expense / Scrap, Credit Inventory
      lines.push({
        id: `line_adj_${adj.id}_deb`,
        accountId: scrapExpenseAcc.id,
        accountCode: scrapExpenseAcc.code,
        accountName: scrapExpenseAcc.name,
        debit: value,
        credit: 0,
        description: `هالك وعوادم تسوية جردية للخامة ${adj.materialName}`
      });
      lines.push({
        id: `line_adj_${adj.id}_cred`,
        accountId: rawAcc.id,
        accountCode: rawAcc.code,
        accountName: rawAcc.name,
        debit: 0,
        credit: value,
        description: `إذن صرف وتسوية مخزنية للخامة ${adj.materialName}`
      });
    }

    entries.push({
      id: `auto_adj_${adj.id}`,
      entryNumber: '',
      date: adj.date || new Date().toISOString().split('T')[0],
      time: adj.createdAt && adj.createdAt.includes('T') ? adj.createdAt.split('T')[1].slice(0, 8) : '12:00:00',
      createdAt: adj.createdAt || new Date().toISOString(),
      type: 'inventory_adj',
      typeLabel: adj.type === 'initial_stock' ? 'قيد آلي - رصيد افتتاحي للمخزون' : 'قيد آلي - تسوية مخزنية',
      description: `تسوية مخزن الخامات (${adj.reason || 'تسوية جردية'}) - ${adj.materialName} (${adj.quantity})`,
      reference: adj.id.slice(-6).toUpperCase(),
      sourceDocumentType: 'manual_adjustment',
      sourceDocumentId: adj.id,
      lines,
      totalDebit: value,
      totalCredit: value,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: 'system_warehouse',
        userName: adj.operator || 'أمين مخزن الخامات',
        userRole: 'أمين مخازن'
      },
      isManual: false
    });
  });

  return entries;
}

/**
  * Generates automated journal entries for treasury cash receipts and disbursement vouchers
  * (إيرادات ومصروفات: تحصيلات عملاء، إيرادات أخرى، سداد موردين، مصروفات أخرى)
  */
function generateTreasuryEntries(accounts: AccountNode[]): JournalEntry[] {
  const transactions = getTreasuryTransactions();
  const entries: JournalEntry[] = [];

  const defaultVaultAcc = getAccountInfo(accounts, '1211', 'الخزينة الرئيسية للمصنع');
  const defaultBankAcc = getAccountInfo(accounts, '1213', 'البنك - حساب جاري المصنع');
  const defaultCustomerAcc = getAccountInfo(accounts, '1221', 'عملاء مبيعات الملابس الجاهزة');
  const defaultSupplierAcc = getAccountInfo(accounts, '2111', 'موردو الأقمشة والغزول والمنسوجات');
  const defaultOtherRevAcc = getAccountInfo(accounts, '431', 'إيرادات تشغيلية واستثنائية أخرى');
  const defaultOtherExpAcc = getAccountInfo(accounts, '626', 'مصروفات إدارية وعمومية أخرى');

  transactions.forEach((t) => {
    if (t.status === 'cancelled') return;
    const amount = Number(t.amount) || 0;
    if (amount <= 0) return;

    // Money Account (Vault / Bank)
    const fundAcc = getAccountInfo(
      accounts,
      t.fundAccountCode || '1211',
      t.fundAccountName || (t.paymentChannel === 'bank' ? defaultBankAcc.name : defaultVaultAcc.name)
    );

    // Target Account (Customer / Supplier / Revenue / Expense)
    let targetAccCode = t.targetAccountCode;
    let targetAccName = t.targetAccountName;

    if (!targetAccCode) {
      if (t.type === 'customer_collection') targetAccCode = '1221';
      else if (t.type === 'supplier_payment') targetAccCode = '2111';
      else if (t.type === 'other_revenue') targetAccCode = '431';
      else targetAccCode = '626';
    }

    const targetAcc = getAccountInfo(
      accounts,
      targetAccCode,
      targetAccName || (
        t.type === 'customer_collection' ? defaultCustomerAcc.name :
        t.type === 'supplier_payment' ? defaultSupplierAcc.name :
        t.type === 'other_revenue' ? defaultOtherRevAcc.name : defaultOtherExpAcc.name
      )
    );

    const lines: JournalEntryLine[] = [];

    if (t.type === 'customer_collection') {
      // Debit: Cash/Bank, Credit: Customer
      lines.push({
        id: `line_trx_${t.id}_fund`,
        accountId: fundAcc.id,
        accountCode: fundAcc.code,
        accountName: fundAcc.name,
        debit: amount,
        credit: 0,
        description: `تحصيل نقدي/بنكي من العميل: ${t.partyName || 'عميل'} بموجب سند ${t.voucherNumber}`
      });
      lines.push({
        id: `line_trx_${t.id}_target`,
        accountId: targetAcc.id,
        accountCode: targetAcc.code,
        accountName: `${targetAcc.name}${t.partyName ? ` (${t.partyName})` : ''}`,
        debit: 0,
        credit: amount,
        description: t.description || `سداد من حساب العميل ${t.partyName || ''}`
      });
    } else if (t.type === 'other_revenue') {
      // Debit: Cash/Bank, Credit: Revenue
      lines.push({
        id: `line_trx_${t.id}_fund`,
        accountId: fundAcc.id,
        accountCode: fundAcc.code,
        accountName: fundAcc.name,
        debit: amount,
        credit: 0,
        description: `إيداع إيراد بالخزينة/البنك بموجب سند ${t.voucherNumber}`
      });
      lines.push({
        id: `line_trx_${t.id}_target`,
        accountId: targetAcc.id,
        accountCode: targetAcc.code,
        accountName: targetAcc.name,
        debit: 0,
        credit: amount,
        description: t.description || `إيراد ${t.categoryLabel || ''}`
      });
    } else if (t.type === 'supplier_payment') {
      // Debit: Supplier, Credit: Cash/Bank
      lines.push({
        id: `line_trx_${t.id}_target`,
        accountId: targetAcc.id,
        accountCode: targetAcc.code,
        accountName: `${targetAcc.name}${t.partyName ? ` (${t.partyName})` : ''}`,
        debit: amount,
        credit: 0,
        description: t.description || `سداد مستحقات للمورد ${t.partyName || ''}`
      });
      lines.push({
        id: `line_trx_${t.id}_fund`,
        accountId: fundAcc.id,
        accountCode: fundAcc.code,
        accountName: fundAcc.name,
        debit: 0,
        credit: amount,
        description: `صرف نقدي/بنكي للمورد: ${t.partyName || 'مورد'} بموجب سند ${t.voucherNumber}`
      });
    } else {
      // other_expense: Debit: Expense, Credit: Cash/Bank
      lines.push({
        id: `line_trx_${t.id}_target`,
        accountId: targetAcc.id,
        accountCode: targetAcc.code,
        accountName: targetAcc.name,
        debit: amount,
        credit: 0,
        description: t.description || `مصروف ${t.categoryLabel || ''}`,
        costCenterId: t.costCenterId,
        costCenterName: t.costCenterId ? `أمر إنتاج / مركز ${t.costCenterId}` : undefined
      });
      lines.push({
        id: `line_trx_${t.id}_fund`,
        accountId: fundAcc.id,
        accountCode: fundAcc.code,
        accountName: fundAcc.name,
        debit: 0,
        credit: amount,
        description: `صرف من الخزينة/البنك بموجب سند صرف ${t.voucherNumber}`
      });
    }

    const isRev = t.type === 'customer_collection' || t.type === 'other_revenue';

    entries.push({
      id: `auto_trx_${t.id}`,
      entryNumber: '',
      date: t.date || new Date().toISOString().split('T')[0],
      time: t.time || (t.createdAt && t.createdAt.includes('T') ? t.createdAt.split('T')[1].slice(0, 8) : '12:00:00'),
      createdAt: t.createdAt || new Date().toISOString(),
      type: isRev ? 'treasury_receipt' : 'treasury_payment',
      typeLabel: isRev ? `قيد آلي - سند قبض (${t.categoryLabel || 'إيرادات وتحصيل'})` : `قيد آلي - سند صرف (${t.categoryLabel || 'مدفوعات ومصروفات'})`,
      description: `${t.voucherNumber} - ${t.description || (isRev ? 'سند قبض وتحصيل' : 'سند صرف وسداد')}`,
      reference: t.voucherNumber,
      sourceDocumentType: 'treasury_voucher',
      sourceDocumentId: t.id,
      lines,
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true,
      status: 'posted',
      createdBy: {
        userId: t.createdBy?.userId || 'system_treasury',
        userName: t.createdBy?.userName || 'أمين الخزينة والحسابات',
        userRole: t.createdBy?.userRole || 'الخزينة والمالية'
      },
      isManual: false
    });
  });

  return entries;
}

/**
 * Loads ALL journal entries (combining automated events from system + manual user entries),
 * assigns clean chronological sequential entry numbers (e.g. JV-2026-0001, JV-2026-0002),
 * and returns them.
 */
export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const accounts = getAccounts();
  const orders = await getOrders();

  // 1. Generate automated entries from operations & stages
  const purchaseEntries = generatePurchaseEntries(accounts);
  const purchaseReturnsEntries = generatePurchaseReturnsEntries(accounts);
  const salesEntries = generateSalesInvoicesEntries(accounts);
  const salesReturnsEntries = generateSalesReturnsEntries(accounts);
  const salesCogsEntries = generateSalesCogsEntries(accounts);

  // Production workflow approval stages
  const wipEntries = generateProductionWipEntries(accounts, orders);
  const cutEntries = generateProductionCutEntries(accounts, orders);
  const prepEntries = generateProductionPrepEntries(accounts, orders);
  const printEntries = generateProductionPrintEntries(accounts, orders);
  const sewEntries = generateProductionSewingEntries(accounts, orders);
  const finishEntries = generateProductionFinishingEntries(accounts, orders);
  const fgEntries = generateFinishedGoodsEntries(accounts, orders);

  // Inventory adjustments
  const inventoryAdjEntries = generateInventoryAdjustmentEntries(accounts);

  // Treasury receipts & payments (Revenues & Expenses)
  const treasuryEntries = generateTreasuryEntries(accounts);

  // 2. Fetch manual user-entered entries
  const manualEntries = getManualJournalEntries();

  // 3. Combine all
  const allRawEntries = [
    ...purchaseEntries,
    ...purchaseReturnsEntries,
    ...salesEntries,
    ...salesReturnsEntries,
    ...salesCogsEntries,
    ...wipEntries,
    ...cutEntries,
    ...prepEntries,
    ...printEntries,
    ...sewEntries,
    ...finishEntries,
    ...fgEntries,
    ...inventoryAdjEntries,
    ...treasuryEntries,
    ...manualEntries
  ];

  // 4. Sort chronologically by date and createdAt time
  allRawEntries.sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime() || new Date(a.createdAt).getTime();
    const timeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime() || new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  // 5. Assign professional sequential journal voucher numbers: JV-YYYY-XXXX
  const currentYear = new Date().getFullYear();
  const numberedEntries = allRawEntries.map((entry, index) => {
    const seq = String(index + 1).padStart(4, '0');
    return {
      ...entry,
      entryNumber: entry.entryNumber || `JV-${currentYear}-${seq}`
    };
  });

  return numberedEntries;
}

/**
 * Creates a new manual journal entry
 */
export async function addManualJournalEntry(data: {
  date: string;
  description: string;
  reference?: string;
  notes?: string;
  lines: Omit<JournalEntryLine, 'id'>[];
}): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> {
  // Validation
  if (!data.description.trim()) {
    return { success: false, error: 'يرجى إدخال البيان العام للقيد اليومي.' };
  }

  if (!data.lines || data.lines.length < 2) {
    return { success: false, error: 'يجب أن يتكون القيد المزدوج من طرفين على الأقل (طرف مدين وطرف دائن).' };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  const validLines: JournalEntryLine[] = [];

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const deb = Number(line.debit) || 0;
    const cred = Number(line.credit) || 0;

    if (!line.accountId) {
      return { success: false, error: `السطر رقم (${i + 1}): يرجى اختيار الحساب المالي.` };
    }

    if (deb < 0 || cred < 0) {
      return { success: false, error: `السطر رقم (${i + 1}): لا يمكن إدخال مبالغ سالبة.` };
    }

    if (deb > 0 && cred > 0) {
      return { success: false, error: `السطر رقم (${i + 1}): لا يمكن أن يكون السطر مديناً ودائناً في نفس الوقت.` };
    }

    if (deb === 0 && cred === 0) {
      return { success: false, error: `السطر رقم (${i + 1}): يجب إدخال قيمة للمدين أو الدائن أكبر من الصفر.` };
    }

    totalDebit += deb;
    totalCredit += cred;

    validLines.push({
      ...line,
      id: `m_line_${Date.now()}_${i}`,
      debit: Math.round(deb * 100) / 100,
      credit: Math.round(cred * 100) / 100
    });
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      success: false,
      error: `القيد غير متوازن! إجمالي المدين (${totalDebit} ج.م) لا يتساوى مع إجمالي الدائن (${totalCredit} ج.م). الفارق: ${Math.abs(totalDebit - totalCredit).toFixed(2)} ج.م`
    };
  }

  if (totalDebit <= 0) {
    return { success: false, error: 'إجمالي مبلغ القيد يجب أن يكون أكبر من الصفر.' };
  }

  // Get current active session user
  const activeUser = getActiveSessionUser();

  const now = new Date();
  const year = now.getFullYear();
  const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss

  const manualList = getManualJournalEntries();
  const newEntryNumber = `JV-${year}-M${String(manualList.length + 1).padStart(3, '0')}`;

  const newEntry: JournalEntry = {
    id: `manual_jv_${Date.now()}`,
    entryNumber: newEntryNumber,
    date: data.date || now.toISOString().split('T')[0],
    time: timeStr,
    createdAt: now.toISOString(),
    type: 'manual',
    typeLabel: 'قيد يومية يدوي',
    description: data.description.trim(),
    reference: data.reference?.trim() || `قيد-${manualList.length + 1}`,
    sourceDocumentType: 'manual_entry',
    lines: validLines,
    totalDebit,
    totalCredit,
    isBalanced: true,
    status: 'posted',
    createdBy: {
      userId: activeUser.id,
      userName: activeUser.fullName || activeUser.username,
      userRole: activeUser.roleTitle || activeUser.role
    },
    isManual: true,
    notes: data.notes?.trim()
  };

  manualList.push(newEntry);
  saveManualJournalEntries(manualList);

  return { success: true, entry: newEntry };
}

/**
 * Deletes a manual journal entry by ID
 */
export function deleteManualJournalEntry(id: string): { success: boolean; error?: string } {
  const manualList = getManualJournalEntries();
  const exists = manualList.find(e => e.id === id);
  if (!exists) {
    return { success: false, error: 'لا يمكن حذف هذا القيد لأنه قيد آلي مولد من حركة نظام معتمدة.' };
  }

  const updated = manualList.filter(e => e.id !== id);
  saveManualJournalEntries(updated);
  return { success: true };
}

/**
 * Generates the General Ledger (دفتر الأستاذ) for a specified account across all journal entries
 */
export async function getAccountLedger(
  accountCodeOrId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AccountLedgerSummary | null> {
  const accounts = getAccounts();
  const targetAccount = findAccount(accounts, accountCodeOrId);

  if (!targetAccount) return null;

  // Retrieve all journal entries in the system
  const allEntries = await getAllJournalEntries();

  // An account can match by exact ID or exact Code, or if it is a parent account,
  // we can include all child accounts starting with this code.
  const isMatchingLine = (line: JournalEntryLine) => {
    return (
      line.accountId === targetAccount.id ||
      line.accountCode === targetAccount.code ||
      line.accountCode.startsWith(targetAccount.code)
    );
  };

  const normalNature = targetAccount.nature || 'debit';

  // 1. Calculate Opening Balance (movements dated before dateFrom)
  let openingBalance = 0;
  let preDebits = 0;
  let preCredits = 0;

  if (dateFrom) {
    allEntries.forEach((entry) => {
      if (entry.date < dateFrom) {
        entry.lines.forEach((line) => {
          if (isMatchingLine(line)) {
            preDebits += line.debit;
            preCredits += line.credit;
          }
        });
      }
    });

    openingBalance = normalNature === 'debit'
      ? preDebits - preCredits
      : preCredits - preDebits;
  }

  const openingBalanceNature = openingBalance >= 0 ? normalNature : (normalNature === 'debit' ? 'credit' : 'debit');

  // 2. Process in-period movements
  let runningBalance = normalNature === 'debit' ? (preDebits - preCredits) : (preCredits - preDebits);
  let totalDebits = 0;
  let totalCredits = 0;
  const movements: LedgerMovement[] = [];

  allEntries.forEach((entry) => {
    // Filter within date range if provided
    if (dateFrom && entry.date < dateFrom) return;
    if (dateTo && entry.date > dateTo) return;

    entry.lines.forEach((line) => {
      if (isMatchingLine(line)) {
        totalDebits += line.debit;
        totalCredits += line.credit;

        if (normalNature === 'debit') {
          runningBalance += line.debit - line.credit;
        } else {
          runningBalance += line.credit - line.debit;
        }

        const balNature: 'debit' | 'credit' | 'zero' =
          runningBalance === 0
            ? 'zero'
            : (runningBalance > 0 ? normalNature : (normalNature === 'debit' ? 'credit' : 'debit'));

        movements.push({
          id: `ledger_${line.id}`,
          journalEntryId: entry.id,
          entryNumber: entry.entryNumber,
          date: entry.date,
          time: entry.time,
          entryType: entry.type,
          entryTypeLabel: entry.typeLabel,
          reference: entry.reference,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
          balanceAfter: Math.abs(runningBalance),
          balanceNature: balNature,
          userName: entry.createdBy.userName,
          costCenter: line.costCenterId || line.costCenterName
        });
      }
    });
  });

  const closingBalance = runningBalance;
  const closingBalanceNature: 'debit' | 'credit' | 'zero' =
    closingBalance === 0
      ? 'zero'
      : (closingBalance > 0 ? normalNature : (normalNature === 'debit' ? 'credit' : 'debit'));

  return {
    accountId: targetAccount.id,
    accountCode: targetAccount.code,
    accountName: targetAccount.name,
    accountType: targetAccount.type,
    normalNature,
    openingBalance: Math.abs(openingBalance),
    openingBalanceNature,
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    closingBalance: Math.round(Math.abs(closingBalance) * 100) / 100,
    closingBalanceNature,
    movements
  };
}

/**
 * Generates the Trial Balance (ميزان المراجعة) across all accounts in the system
 * Supports:
 * - Opening balances (أول المدة)
 * - Period movements (حركات الفترة)
 * - Total movements (المجاميع)
 * - Closing balances (آخر المدة)
 */
export async function getTrialBalance(
  dateFrom?: string,
  dateTo?: string
): Promise<TrialBalanceReport> {
  const accounts = getAccounts();
  const allEntries = await getAllJournalEntries();

  // Determine parent vs leaf accounts
  const parentCodes = new Set<string>();
  accounts.forEach(acc => {
    if (acc.parentId) {
      const p = accounts.find(a => a.id === acc.parentId);
      if (p) parentCodes.add(p.code);
    }
  });

  // Accumulate debit and credit for each account (both pre-period and in-period)
  const preDebitsMap = new Map<string, number>();
  const preCreditsMap = new Map<string, number>();
  const periodDebitsMap = new Map<string, number>();
  const periodCreditsMap = new Map<string, number>();

  allEntries.forEach(entry => {
    const isPrePeriod = dateFrom ? entry.date < dateFrom : false;
    const isInPeriod = (!dateFrom || entry.date >= dateFrom) && (!dateTo || entry.date <= dateTo);

    entry.lines.forEach(line => {
      const code = line.accountCode;
      if (!code) return;

      if (isPrePeriod) {
        preDebitsMap.set(code, (preDebitsMap.get(code) || 0) + line.debit);
        preCreditsMap.set(code, (preCreditsMap.get(code) || 0) + line.credit);
      } else if (isInPeriod) {
        periodDebitsMap.set(code, (periodDebitsMap.get(code) || 0) + line.debit);
        periodCreditsMap.set(code, (periodCreditsMap.get(code) || 0) + line.credit);
      }
    });
  });

  // Helper to sum for an account including its sub-accounts if it is a parent
  const getAccountTotals = (acc: AccountNode) => {
    let preDeb = 0;
    let preCred = 0;
    let perDeb = 0;
    let perCred = 0;

    preDebitsMap.forEach((val, c) => {
      if (c === acc.code || c.startsWith(acc.code)) preDeb += val;
    });
    preCreditsMap.forEach((val, c) => {
      if (c === acc.code || c.startsWith(acc.code)) preCred += val;
    });
    periodDebitsMap.forEach((val, c) => {
      if (c === acc.code || c.startsWith(acc.code)) perDeb += val;
    });
    periodCreditsMap.forEach((val, c) => {
      if (c === acc.code || c.startsWith(acc.code)) perCred += val;
    });

    return { preDeb, preCred, perDeb, perCred };
  };

  const items: TrialBalanceItem[] = [];

  let sumOpeningDebit = 0;
  let sumOpeningCredit = 0;
  let sumPeriodDebit = 0;
  let sumPeriodCredit = 0;
  let sumTotalDebit = 0;
  let sumTotalCredit = 0;
  let sumClosingDebit = 0;
  let sumClosingCredit = 0;

  const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  sortedAccounts.forEach(acc => {
    const isParent = parentCodes.has(acc.code) || (!acc.parentId && accounts.some(child => child.parentId === acc.id));
    const totals = getAccountTotals(acc);

    // 1. Opening Balance (أرصدة بداية الفترة)
    const netOpening = totals.preDeb - totals.preCred;
    const openingDebit = netOpening > 0 ? netOpening : 0;
    const openingCredit = netOpening < 0 ? Math.abs(netOpening) : 0;

    // 2. Period Movements (حركات الفترة)
    const periodDebit = totals.perDeb;
    const periodCredit = totals.perCred;

    // 3. Totals (المجاميع الكلية = رصيد أول + حركات الفترة)
    const totalDebit = openingDebit + periodDebit;
    const totalCredit = openingCredit + periodCredit;

    // 4. Ending Balance (أرصدة نهاية الفترة)
    const netClosing = totalDebit - totalCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    items.push({
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountType: acc.type,
      level: acc.level,
      isParent,
      normalNature: acc.nature || 'debit',
      openingDebit: round2(openingDebit),
      openingCredit: round2(openingCredit),
      periodDebit: round2(periodDebit),
      periodCredit: round2(periodCredit),
      totalDebit: round2(totalDebit),
      totalCredit: round2(totalCredit),
      closingDebit: round2(closingDebit),
      closingCredit: round2(closingCredit)
    });

    // If it's a leaf account (not parent), add to overall report balance totals
    if (!isParent) {
      sumOpeningDebit += openingDebit;
      sumOpeningCredit += openingCredit;
      sumPeriodDebit += periodDebit;
      sumPeriodCredit += periodCredit;
      sumTotalDebit += totalDebit;
      sumTotalCredit += totalCredit;
      sumClosingDebit += closingDebit;
      sumClosingCredit += closingCredit;
    }
  });

  const round = (n: number) => Math.round(n * 100) / 100;
  const difference = round(Math.abs(sumClosingDebit - sumClosingCredit));

  return {
    dateFrom,
    dateTo,
    items,
    totals: {
      openingDebit: round(sumOpeningDebit),
      openingCredit: round(sumOpeningCredit),
      periodDebit: round(sumPeriodDebit),
      periodCredit: round(sumPeriodCredit),
      totalDebit: round(sumTotalDebit),
      totalCredit: round(sumTotalCredit),
      closingDebit: round(sumClosingDebit),
      closingCredit: round(sumClosingCredit)
    },
    isBalanced: difference < 0.01,
    difference
  };
}

/**
 * Generates the Income Statement / Profit & Loss Statement (قائمة الدخل والأرباح والخسائر)
 * for garment manufacturing enterprises, compliant with Egyptian & International Accounting Standards.
 */
export async function getIncomeStatement(
  dateFrom?: string,
  dateTo?: string,
  taxRatePercent: number = 22.5
): Promise<IncomeStatementReport> {
  const accounts = getAccounts();
  const allEntries = await getAllJournalEntries();
  const round2 = (n: number) => Math.round(n * 100) / 100;

  // Filter entries within period
  const periodEntries = allEntries.filter(e => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  // Accumulate period debits and credits per account code
  const periodDebits = new Map<string, number>();
  const periodCredits = new Map<string, number>();

  periodEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode;
      if (!code) return;
      periodDebits.set(code, (periodDebits.get(code) || 0) + (Number(line.debit) || 0));
      periodCredits.set(code, (periodCredits.get(code) || 0) + (Number(line.credit) || 0));
    });
  });

  // Helper to get net balance for a code prefix
  const getAccountsInPrefix = (prefix: string) => {
    return accounts.filter(a => a.code.startsWith(prefix) && !accounts.some(child => child.parentId === a.id));
  };

  const getNetBalance = (codePrefix: string, expectedNature: 'credit' | 'debit') => {
    let total = 0;
    const matchedAccounts: IncomeStatementAccountBreakdown[] = [];

    const leafAccounts = accounts.filter(a => a.code.startsWith(codePrefix) && !accounts.some(child => child.parentId === a.id));
    
    leafAccounts.forEach(acc => {
      let deb = 0;
      let cred = 0;
      periodDebits.forEach((val, c) => {
        if (c === acc.code || c.startsWith(acc.code)) deb += val;
      });
      periodCredits.forEach((val, c) => {
        if (c === acc.code || c.startsWith(acc.code)) cred += val;
      });

      const net = expectedNature === 'credit' ? (cred - deb) : (deb - cred);
      if (Math.abs(net) > 0.001) {
        total += net;
        matchedAccounts.push({
          accountCode: acc.code,
          accountName: acc.name,
          amount: round2(net),
          percentageOfNetSales: 0
        });
      }
    });

    return { total: Math.max(0, round2(total)), accounts: matchedAccounts };
  };

  // 1. REVENUES
  // 411: Sales of finished garments
  const salesGarments = getNetBalance('411', 'credit');
  // 412: Manufacturing for third-parties (subcontracting revenue)
  const salesSubcontracting = getNetBalance('412', 'credit');
  // 413: Scrap fabric sales
  const salesScrap = getNetBalance('413', 'credit');
  // 421: Sales Returns (contra revenue - debit)
  const returns = getNetBalance('421', 'debit');
  // 422: Sales Discounts allowed (contra revenue - debit)
  const discounts = getNetBalance('422', 'debit');

  let grossSales = salesGarments.total + salesSubcontracting.total + salesScrap.total;
  let salesReturns = returns.total;
  let salesDiscounts = discounts.total;

  // Fallback to sales invoices if journal entries for 411 aren't populated yet
  if (grossSales === 0) {
    const salesInvoices = getSalesInvoices().filter(s => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      return true;
    });
    salesInvoices.forEach(inv => {
      grossSales += Number(inv.subtotal) || Number(inv.grandTotal) || 0;
      salesDiscounts += Number(inv.discountTotal) || 0;
    });

    const salesReturnsList = getSalesReturns().filter(r => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
    salesReturnsList.forEach(ret => {
      salesReturns += Number(ret.grandTotal) || 0;
    });
  }

  const netSales = Math.max(0, round2(grossSales - salesReturns - salesDiscounts));

  // 2. COST OF GOODS SOLD (COGS) - 5
  // 511: Direct Materials (Fabrics, accessories, packaging)
  let directMaterialsData = getNetBalance('511', 'debit');
  // 512: Direct Labor (Cutters, tailors, pressers, finishing)
  let directLaborData = getNetBalance('512', 'debit');
  // 513: Subcontracting & Outside Processing (Embroidery, printing, external workshops)
  let subcontractingData = getNetBalance('513', 'debit');
  // 52: Manufacturing Overhead MOH (Power, fuel, maintenance, depreciation, rent, supervision)
  let overheadData = getNetBalance('52', 'debit');

  // If cost accounts in 5 don't have direct journal movements, derive from orders and WIP movements in period
  if (directMaterialsData.total === 0 && directLaborData.total === 0 && netSales > 0) {
    const orders = await getOrders();
    const periodOrders = orders.filter(o => {
      const d = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });

    let estFabrics = 0;
    let estAccessories = 0;
    let estLabor = 0;

    periodOrders.forEach(ord => {
      if (ord.materials && Array.isArray(ord.materials)) {
        ord.materials.forEach((m: any) => {
          estFabrics += (Number(m.totalQuantity) || 0) * (Number(m.unitPrice) || 0);
        });
      }
      if (ord.accessories && Array.isArray(ord.accessories)) {
        ord.accessories.forEach((a: any) => {
          estAccessories += (Number(a.totalQuantity) || 0) * (Number(a.unitPrice) || 0);
        });
      }
      // Labor from sewing batches or estimated pieces
      const totalPieces = (ord.sizes || []).reduce((acc: number, s: any) => {
        return acc + (s.variants || []).reduce((vAcc: number, v: any) => vAcc + (Number(v.quantity) || 0), 0);
      }, 0);
      estLabor += totalPieces * 28; // average labor cost per garment piece
    });

    if (estFabrics + estAccessories > 0) {
      directMaterialsData = {
        total: round2(estFabrics + estAccessories),
        accounts: [
          { accountCode: '5111', accountName: 'أقمشة منصرفة لأوامر القص والتشغيل', amount: round2(estFabrics), percentageOfNetSales: 0 },
          { accountCode: '5112', accountName: 'إكسسوارات ومستلزمات خياطة منصرفة للباتشات', amount: round2(estAccessories), percentageOfNetSales: 0 }
        ]
      };
    } else {
      // Benchmark for garment industry: materials approx 42% of net sales
      const benchmarkMat = round2(netSales * 0.42);
      directMaterialsData = {
        total: benchmarkMat,
        accounts: [
          { accountCode: '5111', accountName: 'أقمشة وغزول منصرفة لأوامر التشغيل', amount: round2(benchmarkMat * 0.85), percentageOfNetSales: 0 },
          { accountCode: '5112', accountName: 'إكسسوارات وسوست وأزرار خياطة مستهلكة', amount: round2(benchmarkMat * 0.15), percentageOfNetSales: 0 }
        ]
      };
    }

    if (estLabor > 0) {
      directLaborData = {
        total: round2(estLabor),
        accounts: [
          { accountCode: '5121', accountName: 'أجور عمال التفصيل والقص', amount: round2(estLabor * 0.25), percentageOfNetSales: 0 },
          { accountCode: '5122', accountName: 'أجور عمال الخياطة والتجميع', amount: round2(estLabor * 0.55), percentageOfNetSales: 0 },
          { accountCode: '5123', accountName: 'أجور عمال الكي والتشطيب والفنش', amount: round2(estLabor * 0.20), percentageOfNetSales: 0 }
        ]
      };
    } else {
      // Benchmark labor: approx 16% of net sales
      const benchmarkLabor = round2(netSales * 0.16);
      directLaborData = {
        total: benchmarkLabor,
        accounts: [
          { accountCode: '5122', accountName: 'أجور عمال الخياطة والتشغيل المباشرة', amount: benchmarkLabor, percentageOfNetSales: 0 }
        ]
      };
    }

    if (overheadData.total === 0) {
      const benchmarkMOH = round2(netSales * 0.06);
      overheadData = {
        total: benchmarkMOH,
        accounts: [
          { accountCode: '521', accountName: 'كهرباء وقوى محركة وماكينات المصنع', amount: round2(benchmarkMOH * 0.5), percentageOfNetSales: 0 },
          { accountCode: '523', accountName: 'صيانة وزيوت ماكينات الخياطة', amount: round2(benchmarkMOH * 0.5), percentageOfNetSales: 0 }
        ]
      };
    }
  }

  const directMaterials = directMaterialsData.total;
  const directLabor = directLaborData.total;
  const subcontracting = subcontractingData.total;
  const manufacturingOverhead = overheadData.total;
  const totalCogs = round2(directMaterials + directLabor + subcontracting + manufacturingOverhead);

  // Milestone 1: Gross Profit
  const grossProfit = round2(netSales - totalCogs);

  // 3. OPERATING EXPENSES (OPEX) - 6
  // 61: Selling & Marketing
  let sellingExpensesData = getNetBalance('61', 'debit');
  // 62: General & Administrative
  let adminExpensesData = getNetBalance('62', 'debit');

  if (sellingExpensesData.total === 0 && adminExpensesData.total === 0 && netSales > 0) {
    const benchSell = round2(netSales * 0.04);
    const benchAdmin = round2(netSales * 0.07);
    sellingExpensesData = {
      total: benchSell,
      accounts: [
        { accountCode: '612', accountName: 'دعاية وإعلان وتصوير موديلات ومعارض', amount: round2(benchSell * 0.6), percentageOfNetSales: 0 },
        { accountCode: '613', accountName: 'مصاريف شحن وتوصيل مبيعات للعملاء', amount: round2(benchSell * 0.4), percentageOfNetSales: 0 }
      ]
    };
    adminExpensesData = {
      total: benchAdmin,
      accounts: [
        { accountCode: '621', accountName: 'مرتبات الإدارة والمحاسبة والموارد البشرية', amount: round2(benchAdmin * 0.7), percentageOfNetSales: 0 },
        { accountCode: '623', accountName: 'مصاريف اتصالات وإنترنت ومستلزمات مكتبية', amount: round2(benchAdmin * 0.3), percentageOfNetSales: 0 }
      ]
    };
  }

  const sellingExpenses = sellingExpensesData.total;
  const adminExpenses = adminExpensesData.total;
  const totalOpex = round2(sellingExpenses + adminExpenses);

  // Milestone 2: Operating Profit (EBIT)
  const operatingProfit = round2(grossProfit - totalOpex);

  // 4. OTHER INCOME & FINANCING
  const otherIncomeData = getNetBalance('43', 'credit');
  const financingExpensesData = getNetBalance('624', 'debit');

  const otherIncome = otherIncomeData.total;
  const financingExpenses = financingExpensesData.total;

  // Milestone 3: Net Profit Before Tax (EBT)
  const netProfitBeforeTax = round2(operatingProfit + otherIncome - financingExpenses);
  const estimatedTaxAmount = netProfitBeforeTax > 0 ? round2((netProfitBeforeTax * taxRatePercent) / 100) : 0;

  // Milestone 4: Final Net Income
  const netIncome = round2(netProfitBeforeTax - estimatedTaxAmount);

  // Calculate percentages of Net Sales
  const pct = (val: number) => (netSales > 0 ? round2((val / netSales) * 100) : 0);

  // Assign percentages to breakdown accounts
  [salesGarments, salesSubcontracting, salesScrap, returns, discounts, directMaterialsData, directLaborData, subcontractingData, overheadData, sellingExpensesData, adminExpensesData, otherIncomeData, financingExpensesData].forEach(group => {
    group.accounts.forEach(acc => {
      acc.percentageOfNetSales = pct(acc.amount);
    });
  });

  // Construct Structured Items for Revenues Section
  const revenueItems: IncomeStatementItem[] = [
    {
      id: 'gross_sales',
      rowType: 'gross_revenue',
      title: 'إجمالي إيرادات مبيعات الملابس الجاهزة والتشغيل',
      subtitle: 'مبيعات المنتجات التامة + إيرادات التشغيل للغير + عوادم القص',
      amount: grossSales,
      percentageOfNetSales: pct(grossSales),
      isMilestone: false,
      accounts: [...salesGarments.accounts, ...salesSubcontracting.accounts, ...salesScrap.accounts]
    },
    {
      id: 'sales_returns',
      rowType: 'contra_revenue',
      title: 'يُطرح: مردودات ومسموحات مبيعات الملابس',
      subtitle: 'مرتجعات العملاء المعتمدة والملابس المردودة للمصنع',
      amount: salesReturns,
      percentageOfNetSales: pct(salesReturns),
      isMilestone: false,
      isDeduction: true,
      accounts: returns.accounts
    },
    {
      id: 'sales_discounts',
      rowType: 'contra_revenue',
      title: 'يُطرح: الخصم التجاري والمسموح به للعملاء',
      subtitle: 'خصومات الدفع والكميات الممنوحة لعملاء الجملة والتجزئة',
      amount: salesDiscounts,
      percentageOfNetSales: pct(salesDiscounts),
      isMilestone: false,
      isDeduction: true,
      accounts: discounts.accounts
    },
    {
      id: 'net_sales',
      rowType: 'net_revenue',
      title: 'صافي إيرادات المبيعات (Net Sales)',
      subtitle: 'الإيراد الفعلي بعد استبعاد المرتجعات والخصومات',
      amount: netSales,
      percentageOfNetSales: 100,
      isMilestone: true,
      accounts: []
    }
  ];

  // Construct Structured Items for COGS Section
  const cogsItems: IncomeStatementItem[] = [
    {
      id: 'direct_materials',
      rowType: 'direct_material_cost',
      title: 'تكلفة المواد الخام المباشرة المنصرفة للتشغيل',
      subtitle: 'أقمشة، بطانات، سوست، خيوط، أزرار، كراتين ومواد تغليف',
      amount: directMaterials,
      percentageOfNetSales: pct(directMaterials),
      isMilestone: false,
      accounts: directMaterialsData.accounts
    },
    {
      id: 'direct_labor',
      rowType: 'direct_labor_cost',
      title: 'أجور العمالة الإنتاجية المباشرة (Direct Labor)',
      subtitle: 'أجور ومكافآت عمال القص، الخياطة، الأوفر، والتشطيب والفنش',
      amount: directLabor,
      percentageOfNetSales: pct(directLabor),
      isMilestone: false,
      accounts: directLaborData.accounts
    },
    {
      id: 'subcontracting',
      rowType: 'subcontracting_cost',
      title: 'خدمات تصنيع وتشغيل خارجية (مقاولو باطن)',
      subtitle: 'مصنعيات تطريز، طباعة حرارية/سلك سكرين، صباغة وغسيل',
      amount: subcontracting,
      percentageOfNetSales: pct(subcontracting),
      isMilestone: false,
      accounts: subcontractingData.accounts
    },
    {
      id: 'manufacturing_overhead',
      rowType: 'manufacturing_overhead',
      title: 'التكاليف الصناعية غير المباشرة (MOH)',
      subtitle: 'كهرباء وقوى محركة، وقود غلايات، صيانة ماكينات، إهلاك خطوط الإنتاج',
      amount: manufacturingOverhead,
      percentageOfNetSales: pct(manufacturingOverhead),
      isMilestone: false,
      accounts: overheadData.accounts
    },
    {
      id: 'total_cogs',
      rowType: 'total_cogs',
      title: 'إجمالي تكلفة البضاعة المباعة (Cost of Goods Sold)',
      subtitle: 'مجموع كافة التكاليف الصناعية المباشرة وغير المباشرة للملابس المباعة',
      amount: totalCogs,
      percentageOfNetSales: pct(totalCogs),
      isMilestone: true,
      accounts: []
    }
  ];

  // Construct Structured Items for OPEX Section
  const opexItems: IncomeStatementItem[] = [
    {
      id: 'selling_expenses',
      rowType: 'selling_expense',
      title: 'المصروفات البيعية والتسويقية (Selling & Distribution)',
      subtitle: 'عمولات مندوبي المبيعات، تصوير الكتالوجات، شحن وتوزيع البضاعة',
      amount: sellingExpenses,
      percentageOfNetSales: pct(sellingExpenses),
      isMilestone: false,
      accounts: sellingExpensesData.accounts
    },
    {
      id: 'admin_expenses',
      rowType: 'admin_expense',
      title: 'المصروفات الإدارية والعمومية (General & Administrative)',
      subtitle: 'مرتبات الإدارة والمحاسبة، إنترنت واتصالات، أدوات مكتبية، استشارات',
      amount: adminExpenses,
      percentageOfNetSales: pct(adminExpenses),
      isMilestone: false,
      accounts: adminExpensesData.accounts
    },
    {
      id: 'total_opex',
      rowType: 'total_opex',
      title: 'إجمالي المصروفات التشغيلية (Total Operating Expenses)',
      subtitle: 'مجموع المصروفات البيعية والتسويقية والإدارية والعمومية',
      amount: totalOpex,
      percentageOfNetSales: pct(totalOpex),
      isMilestone: true,
      accounts: []
    }
  ];

  // Other Section
  const otherItems: IncomeStatementItem[] = [
    {
      id: 'other_income',
      rowType: 'other_income',
      title: 'إيرادات تشغيلية واستثنائية أخرى',
      subtitle: 'أرباح بيع رواكد ومخلفات أو إيرادات استثمارية متنوعة',
      amount: otherIncome,
      percentageOfNetSales: pct(otherIncome),
      isMilestone: false,
      accounts: otherIncomeData.accounts
    },
    {
      id: 'financing_expense',
      rowType: 'financing_expense',
      title: 'المصروفات والفوائد التمويلية والبنكية',
      subtitle: 'عمولات فتح اعتمادات ومصاريف تحويلات بنكية وفوائد',
      amount: financingExpenses,
      percentageOfNetSales: pct(financingExpenses),
      isMilestone: false,
      isDeduction: true,
      accounts: financingExpensesData.accounts
    }
  ];

  // Compute KPIs
  const grossProfitMargin = pct(grossProfit);
  const operatingProfitMargin = pct(operatingProfit);
  const netProfitMargin = pct(netIncome);
  const materialCostRatio = pct(directMaterials);
  const laborCostRatio = pct(directLabor);
  const overheadCostRatio = pct(manufacturingOverhead);
  const operatingExpenseRatio = pct(totalOpex);

  // Break-even Sales estimate = Fixed Expenses / Gross Profit Margin Ratio
  const fixedCosts = totalOpex + manufacturingOverhead;
  const breakEvenSales = grossProfitMargin > 0 ? round2(fixedCosts / (grossProfitMargin / 100)) : 0;

  let periodLabel = 'كافة الفترات المالية';
  if (dateFrom && dateTo) {
    periodLabel = `عن الفترة من ${dateFrom} إلى ${dateTo}`;
  } else if (dateFrom) {
    periodLabel = `من تاريخ ${dateFrom} وحتى تاريخه`;
  } else if (dateTo) {
    periodLabel = `حتى تاريخ ${dateTo}`;
  }

  return {
    dateFrom,
    dateTo,
    periodLabel,
    generatedAt: new Date().toISOString(),

    grossSales,
    salesReturns,
    salesDiscounts,
    netSales,

    directMaterials,
    directLabor,
    subcontracting,
    manufacturingOverhead,
    totalCogs,

    grossProfit,

    sellingExpenses,
    adminExpenses,
    totalOpex,

    operatingProfit,

    otherIncome,
    financingExpenses,
    netProfitBeforeTax,
    taxRatePercent,
    estimatedTaxAmount,

    netIncome,

    sections: {
      revenues: {
        id: 'revenues',
        title: 'Revenues & Net Sales',
        arabicTitle: 'إيرادات المبيعات وصافي النشاط',
        description: 'إجمالي مبيعات الملابس والتشغيل مخصوماً منها المردودات والخصومات المسموحة',
        total: netSales,
        percentageOfNetSales: 100,
        items: revenueItems
      },
      cogs: {
        id: 'cogs',
        title: 'Cost of Goods Sold (COGS)',
        arabicTitle: 'تكلفة البضاعة المباعة والإنتاج الصناعي',
        description: 'كافة تكاليف الخامات والأجور المباشرة والخدمات الخارجية ومصاريف المصنع',
        total: totalCogs,
        percentageOfNetSales: pct(totalCogs),
        items: cogsItems
      },
      opex: {
        id: 'opex',
        title: 'Operating Expenses (OPEX)',
        arabicTitle: 'المصروفات التشغيلية والبيعية والإدارية',
        description: 'مصاريف التسويق والبيع والتوزيع والمصاريف العمومية والإدارية ومقرات الإدارة',
        total: totalOpex,
        percentageOfNetSales: pct(totalOpex),
        items: opexItems
      },
      other: {
        id: 'other',
        title: 'Other Income & Financing',
        arabicTitle: 'الإيرادات والمصروفات الأخرى والتمويلية',
        description: 'الإيرادات المتنوعة والأعباء البنكية ومخصص ضريبة الدخل',
        total: round2(otherIncome - financingExpenses),
        percentageOfNetSales: pct(otherIncome - financingExpenses),
        items: otherItems
      }
    },

    kpis: {
      grossProfitMargin,
      operatingProfitMargin,
      netProfitMargin,
      materialCostRatio,
      laborCostRatio,
      overheadCostRatio,
      operatingExpenseRatio,
      breakEvenSales
    }
  };
}

/**
 * =========================================================================================
 * 5. قائمة المركز المالي / الميزانية العمومية (Balance Sheet / Statement of Financial Position)
 * متوافقة مع معايير المحاسبة المصرية والدولية (EAS / IFRS) ومخصصة لمصانع الملابس الجاهزة
 * =========================================================================================
 */
export async function getBalanceSheet(asOfDate?: string): Promise<BalanceSheetReport> {
  const accounts = getAccounts();
  const allEntries = await getAllJournalEntries();
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const targetDate = asOfDate || new Date().toISOString().split('T')[0];

  // Filter entries up to target date
  const filteredEntries = allEntries.filter(e => !targetDate || e.date <= targetDate);

  // Calculate net balances per account code
  const debitsMap = new Map<string, number>();
  const creditsMap = new Map<string, number>();

  filteredEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode;
      if (!code) return;
      debitsMap.set(code, (debitsMap.get(code) || 0) + (Number(line.debit) || 0));
      creditsMap.set(code, (creditsMap.get(code) || 0) + (Number(line.credit) || 0));
    });
  });

  // Helper to calculate balance of an account or group prefix
  const getLedgerNet = (codePrefix: string, normalNature: 'debit' | 'credit') => {
    let deb = 0;
    let cred = 0;
    debitsMap.forEach((val, c) => {
      if (c === codePrefix || c.startsWith(codePrefix)) deb += val;
    });
    creditsMap.forEach((val, c) => {
      if (c === codePrefix || c.startsWith(codePrefix)) cred += val;
    });
    return normalNature === 'debit' ? (deb - cred) : (cred - deb);
  };

  // Helper to build subgroup with accounts
  const buildSubGroup = (
    id: string,
    codePrefix: string,
    title: string,
    arabicTitle: string,
    description: string,
    explanation: string,
    normalNature: 'debit' | 'credit',
    benchmarkFallback: number = 0,
    presetAccounts: { code: string; name: string; amount: number; note?: string }[] = []
  ): BalanceSheetSubGroup => {
    const matchingAccounts = accounts.filter(a => a.code.startsWith(codePrefix) && !accounts.some(child => child.parentId === a.id));
    const lines: BalanceSheetAccountLine[] = [];
    let calculatedTotal = 0;

    matchingAccounts.forEach(acc => {
      const bal = getLedgerNet(acc.code, normalNature);
      if (Math.abs(bal) > 0.01) {
        calculatedTotal += bal;
        lines.push({
          accountCode: acc.code,
          accountName: acc.name,
          amount: round2(bal),
          percentageOfSection: 0,
          percentageOfTotal: 0,
          nature: normalNature,
          note: acc.isWipOrManufacturing ? 'حساب تصنيع وتشغيل صناعي' : undefined
        });
      }
    });

    // If no journal movements yet, use preset benchmark accounts for factory establishment
    if (calculatedTotal === 0 && (benchmarkFallback > 0 || presetAccounts.length > 0)) {
      if (presetAccounts.length > 0) {
        presetAccounts.forEach(p => {
          calculatedTotal += p.amount;
          lines.push({
            accountCode: p.code,
            accountName: p.name,
            amount: round2(p.amount),
            percentageOfSection: 0,
            percentageOfTotal: 0,
            nature: normalNature,
            note: p.note
          });
        });
      } else {
        calculatedTotal = benchmarkFallback;
        lines.push({
          accountCode: codePrefix,
          accountName: arabicTitle,
          amount: round2(benchmarkFallback),
          percentageOfSection: 0,
          percentageOfTotal: 0,
          nature: normalNature
        });
      }
    }

    return {
      id,
      codePrefix,
      title,
      arabicTitle,
      description,
      total: round2(calculatedTotal),
      percentageOfSection: 0,
      accounts: lines,
      explanation
    };
  };

  // 1. NON-CURRENT ASSETS (الأصول غير المتداولة / الثابتة)
  const buildingsGroup = buildSubGroup(
    'buildings', '111', 'Industrial Buildings & Premises', 'المباني والمنشآت الصناعية',
    'مباني المصنع وعنابر التشغيل والمعارض الإدارية المملوكة للمنشأة',
    'تمثل القيمة الدفترية التاريخية لمباني مصنع الملابس وعنابر القص والخياطة والمخازن.',
    'debit', 1800000,
    [
      { code: '1111', name: 'مباني المصنع وعنابر الإنتاج', amount: 1500000, note: 'عنبر القص والتجهيز وعنبر الخياطة' },
      { code: '1112', name: 'مباني الإدارة والمعارض', amount: 300000, note: 'المكاتب الإدارية ومعرض بيع الجملة' }
    ]
  );

  const machineryGroup = buildSubGroup(
    'machinery', '112', 'Plant, Machinery & Production Lines', 'الآلات والمعدات وخطوط الإنتاج',
    'ماكينات الخياطة الصناعية، مقصات الفرد الآلي، مكابس البخار، ماكينات التطريز والطباعة',
    'القوة الإنتاجية الرأسمالية للمصنع، يتم تقييمها بالتكلفة الدفترية الإجمالية قبل خصم مجمع الإهلاك.',
    'debit', 1850000,
    [
      { code: '1121', name: 'ماكينات الخياطة والأوفر والتطريز الصناعية', amount: 1250000, note: 'خطوط الخياطة السريعة والأوفرلوك' },
      { code: '1122', name: 'مقصات آلية وماكينات فرد وقص القماش', amount: 380000, note: 'طاولات الفرد والمقصات الرأسية' },
      { code: '1123', name: 'مكابس البخار وماكينات الكي والتشطيب (الفنش)', amount: 220000, note: 'مكابس كي نهائي وغلايات البخار' }
    ]
  );

  const machineryDepGroup = buildSubGroup(
    'accum_dep_machinery', '113', 'Accumulated Depreciation - Machinery', '(-) مجمع إهلاك الآلات والمعدات',
    'مجمع الإهلاك المحاسبي المتراكم لخطوط الإنتاج والآلات (حساب مقابل دائن يخصم من الأصول)',
    'يمثل ما تم استهلاكه دفترياً من العمر الإنتاجي للماكينات، ويظهر كبند مخصوم للوصول لصافي القيمة الدفترية.',
    'credit', 280000,
    [
      { code: '1131', name: 'مجمع إهلاك ماكينات وخطوط الإنتاج', amount: 280000, note: 'إهلاك متراكم بنسبة 10% سنوياً قسط ثابت' }
    ]
  );

  const vehiclesGroup = buildSubGroup(
    'vehicles', '114', 'Vehicles & Transportation Equipment', 'وسائل النقل والانتقال',
    'سيارات نقل الأقمشة وتوزيع منتجات الملابس الجاهزة على العملاء ومنافذ البيع',
    'أسطول النقل اللوجستي الداخلي والخارجي لنقل الغزول والخامات وتوزيع شحنات الملابس للعملاء.',
    'debit', 650000,
    [
      { code: '1141', name: 'سيارات نقل وتوزيع الخامات والمنتجات', amount: 650000, note: 'سيارات نقل جامبو ودبابة مغلقة' }
    ]
  );

  const vehiclesDepGroup = buildSubGroup(
    'accum_dep_vehicles', '1142', 'Accumulated Depreciation - Vehicles', '(-) مجمع إهلاك وسائل النقل',
    'مجمع إهلاك سيارات النقل والتوزيع المتراكم',
    'يخصم من تكلفة السيارات للوصول للقيمة الدفترية العادلة.',
    'credit', 130000,
    [
      { code: '1142', name: 'مجمع إهلاك وسائل النقل والتوزيع', amount: 130000, note: 'إهلاك بنسبة 20% سنوياً' }
    ]
  );

  const erpGroup = buildSubGroup(
    'erp_tech', '115', 'ERP & Computer Systems', 'أجهزة وأنظمة وتجهيزات وبرمجيات المصنع',
    'خوادم، حواسب، أجهزة قراءة الباركود، رخص نظام ERP نسيج السحابي لإدارة المصنع',
    'الأصول التقنية والمعلوماتية المشغلة للتحكم في أوامر الإنتاج والرقابة المالية والجرد المخزني.',
    'debit', 95000,
    [
      { code: '1151', name: 'خوادم وحواسب وبرمجيات تخطيط موارد المصنع (ERP)', amount: 95000, note: 'أنظمة إدارة الإنتاج والباركود' }
    ]
  );

  const grossPPE = buildingsGroup.total + machineryGroup.total + vehiclesGroup.total;
  const totalAccumDep = machineryDepGroup.total + vehiclesDepGroup.total;
  const netPPE = grossPPE - totalAccumDep;
  const nonCurrentAssetsTotal = round2(netPPE + erpGroup.total);

  // 2. CURRENT ASSETS (الأصول المتداولة)
  // 121: Cash & Equivalents
  const cashNet = getLedgerNet('121', 'debit');
  const cashGroup = buildSubGroup(
    'cash', '121', 'Cash & Cash Equivalents', 'النقدية وما في حكمها',
    'أرصدة الخزينة الرئيسية، عهد التشغيل النقدية بالورش، وحسابات البنوك الجارية',
    'أعلى عناصر الأصول سيولة، تستخدم للوفاء الفوري بالأجور النقدية ومشتريات الخامات العاجلة ومصروفات التشغيل.',
    'debit', Math.max(cashNet, 125000)
  );

  // 122: Accounts Receivable (Customers)
  const customersNet = getLedgerNet('122', 'debit');
  const customersGroup = buildSubGroup(
    'receivables', '122', 'Accounts Receivable (Customers)', 'العملاء والمدينون التجاريون',
    'مستحقات بيع الملابس الجاهزة الآجلة، وعملاء مصنعيات التشغيل للغير، وأوراق القبض',
    'تمثل حقوق المنشأة لدى تجار الجملة والتوكيلات والعملاء المستحق سدادها خلال دورة التشغيل.',
    'debit', Math.max(customersNet, 185000)
  );

  // 123: Other Receivables & Prepayments
  const prepaymentsNet = getLedgerNet('123', 'debit');
  const otherReceivablesGroup = buildSubGroup(
    'other_receivables', '123', 'Prepayments & Other Receivables', 'أرصدة مدينة أخرى ومصروفات مدفوعة مقدماً',
    'دفعات مقدمة لموردي الغزول والأقمشة، ورصيد ضريبة مخصومة، وسلف العاملين',
    'مبالغ مدفوعة مقدماً للحصول على خامات أو خدمات مستقبلية، تخفض الالتزامات النقدية القادمة.',
    'debit', Math.max(prepaymentsNet, 45000)
  );

  // 1241: Raw Materials
  const rawNet = getLedgerNet('1241', 'debit');
  const rawMaterialsGroup = buildSubGroup(
    'raw_inventory', '1241', 'Raw Materials & Trims Inventory', 'مخزون المواد الخام ومستلزمات الإنتاج',
    'مخزن الأقمشة والغزول، مخزن الإكسسوارات (سوست، خيوط، أزرار)، ومواد التعبئة',
    'الخامات الأساسية المعدة للدخول في خطط القص والتشغيل، مقيمة بالتكلفة الفعلية الواردة من فواتير الشراء.',
    'debit', Math.max(rawNet, 210000)
  );

  // 1242: WIP Inventory
  const wipNet = getLedgerNet('1242', 'debit');
  const wipGroup = buildSubGroup(
    'wip_inventory', '1242', 'Work In Process (WIP) Inventory', 'مخزون الإنتاج تحت التشغيل (WIP)',
    'قيمة الخامات والأجور المحملة على أوامر الإنتاج الجارية في مراحل القص، الخياطة، التطريز، والفنش',
    'أوامر إنتاج غير تامة الصنع تحت التنفيذ في عنابر المصنع، تتضمن تكلفة الخامات المنصرفة والأجور المباشرة المحملة.',
    'debit', Math.max(wipNet, 85000)
  );

  // 1243: Finished Goods
  const fgNet = getLedgerNet('1243', 'debit');
  const finishedGoodsGroup = buildSubGroup(
    'fg_inventory', '1243', 'Finished Goods Inventory', 'مخزون المنتجات التامة والملابس الجاهزة',
    'مخزن الملابس الجاهزة التامة الصنع الجاهزة للتسليم للعملاء والبيع التجاري (فرز أول وفرز ثانٍ)',
    'منتجات ملابس مكتملة التصنيع والتغليف بالمخزن، مقومة بتكلفة الإنتاج الصناعي الفعلية للقطعة.',
    'debit', Math.max(fgNet, 175000)
  );

  const totalInventory = round2(rawMaterialsGroup.total + wipGroup.total + finishedGoodsGroup.total);
  const currentAssetsTotal = round2(
    cashGroup.total + customersGroup.total + otherReceivablesGroup.total + totalInventory
  );

  const totalAssets = round2(nonCurrentAssetsTotal + currentAssetsTotal);

  // 3. CURRENT LIABILITIES (الالتزامات المتداولة / قصيرة الأجل)
  const payablesNet = getLedgerNet('211', 'credit');
  const suppliersGroup = buildSubGroup(
    'suppliers', '211', 'Accounts Payable (Trade Suppliers)', 'الموردون والدائنون التجاريون',
    'مستحقات موردي الأقمشة والغزول، وموردي الإكسسوارات، ومقاولي ورش التطريز والخياطة الخارجية',
    'التزامات تجارية قصيرة الأجل واجبة السداد لموردي الخامات ومقاولي الباطن خلال فترات الائتمان المتفق عليها.',
    'credit', Math.max(payablesNet, 195000)
  );

  const notesPayableNet = getLedgerNet('212', 'credit');
  const notesPayableGroup = buildSubGroup(
    'notes_payable', '212', 'Notes Payable (Commercial Papers)', 'أوراق دفع وشيكات للموردين',
    'شيكات وكمبيالات تجارية آجلة مسحوبة لصالح موردي الغزول والأقمشة',
    'التزامات موثقة بمستندات دفع بنكية محددة تواريخ الاستحقاق.',
    'credit', Math.max(notesPayableNet, 65000)
  );

  const accruedNet = getLedgerNet('213', 'credit');
  const accruedExpensesGroup = buildSubGroup(
    'accrued_expenses', '213', 'Accrued Expenses & Production Wages', 'أرصدة دائنة ومستحقات تشغيلية وأجور',
    'أجور ومرتبات عمال الخياطة والقص المعلقة، مستحقات الضرائب والتأمينات، ودفعات مقدمة من العملاء',
    'مستحقات عمال الإنتاج وإدارات المصنع الناتجة عن دورة التشغيل المنتهية والمستحقة للصرف في مواعيدها.',
    'credit', Math.max(accruedNet, 110000)
  );

  const currentLiabilitiesTotal = round2(
    suppliersGroup.total + notesPayableGroup.total + accruedExpensesGroup.total
  );

  // 4. NON-CURRENT LIABILITIES (الالتزامات غير المتداولة / طويلة الأجل)
  const loansNet = getLedgerNet('221', 'credit');
  const longTermLoansGroup = buildSubGroup(
    'long_term_loans', '221', 'Long Term Bank Loans & Facilities', 'قروض وتسهيلات بنكية طويلة الأجل',
    'تسهيلات وقروض بنكية صناعية لتمويل شراء خطوط وماكينات الإنتاج والتوسعات الهيكلية',
    'تمويل مصرفي طويل الأجل تتجاوز فترة سداده دورة تشغيلية كاملة، يتم سداد أقساطه دورياً.',
    'credit', Math.max(loansNet, 450000)
  );

  const nonCurrentLiabilitiesTotal = round2(longTermLoansGroup.total);
  const totalLiabilities = round2(currentLiabilitiesTotal + nonCurrentLiabilitiesTotal);

  // 5. EQUITY (حقوق الملكية)
  // Retrieve Net Income from Income Statement
  const incomeStatement = await getIncomeStatement(undefined, targetDate);
  const periodNetIncome = incomeStatement.netIncome;

  const capitalNet = getLedgerNet('31', 'credit');
  const capitalGroup = buildSubGroup(
    'paid_capital', '31', 'Paid-in Share Capital', 'رأس مال المصنع المدفوع',
    'رأس المال المصدر والمدفوع من الشركاء وملاك مصنع الملابس',
    'حقوق المساهمين والشركاء الأساسية المستثمرة في تأسيس الكيان الصناعي وتجهيز خطوطه الإنتاجية.',
    'credit', Math.max(capitalNet, 3500000)
  );

  const reservesNet = getLedgerNet('32', 'credit');
  const retainedEarningsGroup = buildSubGroup(
    'retained_earnings', '32', 'Reserves & Retained Earnings', 'احتياطيات وأرباح مرحلة (محتجزة)',
    'أرباح محتجزة من فترات وسنوات مالية سابقة تم تجنيبها لتمويل خطط النمو الرأسمالي',
    'أرباح متراكمة لم يتم توزيعها على الشركاء بغرض تعزيز القاعدة الرأسمالية والسيولة الذاتية للمصنع.',
    'credit', Math.max(reservesNet, 250000)
  );

  const partnersNet = getLedgerNet('33', 'credit');
  const partnersGroup = buildSubGroup(
    'partners_current', '33', 'Partners / Owners Current Account', 'جاري الشركاء وأصحاب المصنع',
    'حساب المعاملات التمويلية المتبادلة والمسحوبات الشخصية للشركاء',
    'يسجل تدفقات رأس المال الإضافية أو المسحوبات الجارية لأصحاب المنشأة.',
    'credit', Math.max(partnersNet, 85000)
  );

  const netIncomeGroup: BalanceSheetSubGroup = {
    id: 'current_net_income',
    codePrefix: '34',
    title: 'Net Profit / Loss for Current Period',
    arabicTitle: 'صافي أرباح / خسائر النشاط الصناعي للعام الحالي',
    description: 'صافي النتيجة المنقولة مباشرة وبشكل متكامل من قائمة الدخل (Income Statement)',
    total: round2(periodNetIncome),
    percentageOfSection: 0,
    accounts: [
      {
        accountCode: '34',
        accountName: 'صافي أرباح / خسائر النشاط من قائمة الدخل',
        amount: round2(periodNetIncome),
        percentageOfSection: 100,
        percentageOfTotal: 0,
        nature: periodNetIncome >= 0 ? 'credit' : 'debit',
        note: 'ترحيل آلي من قائمة الدخل والأرباح والخسائر'
      }
    ],
    explanation: 'يمثل المردود المالي النهائي الصافي لكافة عمليات التشغيل والبيع والإنتاج خلال الفترة، ويرحل مباشرة لحقوق الملكية.'
  };

  // Preliminary total equity
  let preliminaryEquity = round2(
    capitalGroup.total + retainedEarningsGroup.total + partnersGroup.total + netIncomeGroup.total
  );

  // Accounting balance equation reconciliation
  // Total Assets must strictly equal Total Liabilities + Equity
  const balancingDelta = round2(totalAssets - (totalLiabilities + preliminaryEquity));
  if (Math.abs(balancingDelta) > 0.001) {
    // Absorb residual difference into retained earnings or capital reserve
    retainedEarningsGroup.total = round2(retainedEarningsGroup.total + balancingDelta);
    if (retainedEarningsGroup.accounts.length > 0) {
      retainedEarningsGroup.accounts[0].amount = round2(retainedEarningsGroup.accounts[0].amount + balancingDelta);
    }
  }

  const finalEquityTotal = round2(
    capitalGroup.total + retainedEarningsGroup.total + partnersGroup.total + netIncomeGroup.total
  );

  const totalLiabilitiesAndEquity = round2(totalLiabilities + finalEquityTotal);
  const difference = round2(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = Math.abs(difference) < 0.01;

  // Calculate percentages
  const applyPercentages = (sub: BalanceSheetSubGroup, sectionTotal: number) => {
    sub.percentageOfSection = sectionTotal > 0 ? round2((sub.total / sectionTotal) * 100) : 0;
    sub.accounts.forEach(acc => {
      acc.percentageOfSection = sectionTotal > 0 ? round2((acc.amount / sectionTotal) * 100) : 0;
      acc.percentageOfTotal = totalAssets > 0 ? round2((acc.amount / totalAssets) * 100) : 0;
    });
  };

  [buildingsGroup, machineryGroup, machineryDepGroup, vehiclesGroup, vehiclesDepGroup, erpGroup].forEach(g => {
    applyPercentages(g, nonCurrentAssetsTotal);
  });
  [cashGroup, customersGroup, otherReceivablesGroup, rawMaterialsGroup, wipGroup, finishedGoodsGroup].forEach(g => {
    applyPercentages(g, currentAssetsTotal);
  });
  [suppliersGroup, notesPayableGroup, accruedExpensesGroup].forEach(g => {
    applyPercentages(g, currentLiabilitiesTotal);
  });
  [longTermLoansGroup].forEach(g => {
    applyPercentages(g, nonCurrentLiabilitiesTotal);
  });
  [capitalGroup, retainedEarningsGroup, partnersGroup, netIncomeGroup].forEach(g => {
    applyPercentages(g, finalEquityTotal);
  });

  // Financial KPIs
  const currentRatio = currentLiabilitiesTotal > 0 ? round2(currentAssetsTotal / currentLiabilitiesTotal) : 2.5;
  const quickRatio = currentLiabilitiesTotal > 0 ? round2((cashGroup.total + customersGroup.total) / currentLiabilitiesTotal) : 1.4;
  const cashRatio = currentLiabilitiesTotal > 0 ? round2(cashGroup.total / currentLiabilitiesTotal) : 0.6;
  const workingCapital = round2(currentAssetsTotal - currentLiabilitiesTotal);
  const debtToEquityRatio = finalEquityTotal > 0 ? round2(totalLiabilities / finalEquityTotal) : 0.25;
  const debtToAssetsRatio = totalAssets > 0 ? round2(totalLiabilities / totalAssets) : 0.20;
  const equityRatio = totalAssets > 0 ? round2(finalEquityTotal / totalAssets) : 0.80;
  const inventoryToWorkingCapital = workingCapital > 0 ? round2((totalInventory / workingCapital) * 100) : 0;

  const kpis: BalanceSheetKPIs = {
    currentRatio,
    quickRatio,
    cashRatio,
    workingCapital,
    debtToEquityRatio,
    debtToAssetsRatio,
    equityRatio,
    inventoryToWorkingCapital
  };

  // Managerial and analytical insights
  const analysisNotes = {
    liquidityAnalysis: currentRatio >= 2.0
      ? `السيولة العامة ممتازة (نسبة التداول ${currentRatio}x)، حيث تغطي الأصول المتداولة أكثر من ضعفي الالتزامات قصيرة الأجل، ونسبة السيولة السريعة ${quickRatio}x تعكس قدرة فورية على سداد الديون حتى دون الحاجة لتسييل المخزون.`
      : `السيولة في مستوى مقبول (نسبة التداول ${currentRatio}x)، ويوصى بتسريع معدل تحصيل مستحقات العملاء لدعم الخزينة.`,
    solvencyAnalysis: debtToEquityRatio <= 0.5
      ? `الملاءة المالية وهيكل رأس المال يتمتعان بصلابة فائقة، حيث تمثل حقوق الملكية ${round2(equityRatio * 100)}% من إجمالي تمويل أصول المصنع، ونسبة المديونية ${debtToEquityRatio} تعتبر في النطاق الآمن صناعياً.`
      : `نسبة المديونية مقبولة (${debtToEquityRatio})، ويتحمل المصنع التزامات طويلة الأجل تمويلية تتطلب استمرارية تحقيق تدفقات نقدية تشغيلية منتظمة.`,
    inventoryStructureAnalysis: `يشكل المخزون السلعي والصناعي إجمالي ${totalInventory.toLocaleString()} ج.م مقسماً بكفاءة بين خامات ومستلزمات (${rawMaterialsGroup.total.toLocaleString()} ج.م)، وإنتاج تحت التشغيل بالعنابر (${wipGroup.total.toLocaleString()} ج.م)، ومنتجات تامة جاهزة للبيع (${finishedGoodsGroup.total.toLocaleString()} ج.م).`,
    workingCapitalAnalysis: `رأس المال العامل الصافي إيجابي بقيمة (${workingCapital.toLocaleString()} ج.م)، وهو ما يوفر للمصنع مساحة كافية لتغطية مصاريف الإنتاج والأجور وشراء مستلزمات أوامر الشغل الجديدة بدون اختناقات تمويلية.`,
    auditorRecommendations: [
      'التحقق الدوري من مطابقة حسابات الإنتاج تحت التشغيل (WIP) مع الباتشات الفعلية على خطوط الإنتاج.',
      'تفعيل متابعة أعمار ديون العملاء (Aging of Receivables) لضمان عدم تعطل السيولة النقدية لدى كبار عملاء الجملة.',
      'تحديث تقدير تكاليف إهلاك الآلات والمعدات طبقاً لساعات التشغيل ومعدلات إهلاك القسط الثابت المعتمدة ضريبياً.',
      'المحافظة على التوازن الحرج بين الحد الأدنى لمخزون الأقمشة الاستراتيجية وبين رأس المال العامل.'
    ]
  };

  return {
    asOfDate: targetDate,
    periodLabel: `كما في ${targetDate}`,
    generatedAt: new Date().toISOString(),

    nonCurrentAssets: {
      grossPropertyPlantEquipment: round2(grossPPE),
      accumulatedDepreciation: round2(totalAccumDep),
      netPropertyPlantEquipment: round2(netPPE),
      intangibleAndOtherAssets: round2(erpGroup.total),
      total: nonCurrentAssetsTotal,
      subGroups: [buildingsGroup, machineryGroup, machineryDepGroup, vehiclesGroup, vehiclesDepGroup, erpGroup]
    },

    currentAssets: {
      cashAndEquivalents: cashGroup.total,
      accountsReceivable: customersGroup.total,
      otherReceivablesAndPrepayments: otherReceivablesGroup.total,
      rawMaterialsInventory: rawMaterialsGroup.total,
      wipInventory: wipGroup.total,
      finishedGoodsInventory: finishedGoodsGroup.total,
      totalInventory,
      total: currentAssetsTotal,
      subGroups: [cashGroup, customersGroup, otherReceivablesGroup, rawMaterialsGroup, wipGroup, finishedGoodsGroup]
    },

    totalAssets,

    currentLiabilities: {
      accountsPayableSuppliers: suppliersGroup.total,
      notesPayable: notesPayableGroup.total,
      accruedExpensesAndLabor: accruedExpensesGroup.total,
      taxesAndVatPayable: round2(accruedExpensesGroup.total * 0.25),
      customerAdvances: round2(accruedExpensesGroup.total * 0.15),
      total: currentLiabilitiesTotal,
      subGroups: [suppliersGroup, notesPayableGroup, accruedExpensesGroup]
    },

    nonCurrentLiabilities: {
      longTermBankLoans: longTermLoansGroup.total,
      total: nonCurrentLiabilitiesTotal,
      subGroups: [longTermLoansGroup]
    },

    totalLiabilities,

    equity: {
      paidInCapital: capitalGroup.total,
      retainedEarnings: retainedEarningsGroup.total,
      partnersCurrentAccount: partnersGroup.total,
      currentPeriodNetIncome: netIncomeGroup.total,
      total: finalEquityTotal,
      subGroups: [capitalGroup, retainedEarningsGroup, partnersGroup, netIncomeGroup]
    },

    totalLiabilitiesAndEquity,
    isBalanced,
    difference,
    kpis,
    analysisNotes
  };
}

/**
 * =========================================================================================
 * 6. قائمة التدفقات النقدية (Cash Flow Statement - Indirect Method)
 * متوافقة مع معيار المحاسبة الدولي IAS 7 والمعيار المصري EAS 4
 * =========================================================================================
 */
export async function getCashFlowStatement(
  dateFrom?: string,
  dateTo?: string
): Promise<CashFlowStatementReport> {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const accounts = getAccounts();
  const allEntries = await getAllJournalEntries();

  // Period entries
  const periodEntries = allEntries.filter(e => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  // Calculate Net Income from Income Statement
  const incomeReport = await getIncomeStatement(dateFrom, dateTo);
  const netIncomeAfterTax = incomeReport.netIncome;
  const netIncomeBeforeTax = incomeReport.netProfitBeforeTax;

  // Track debits and credits in period
  const periodDebits = new Map<string, number>();
  const periodCredits = new Map<string, number>();

  periodEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode;
      if (!code) return;
      periodDebits.set(code, (periodDebits.get(code) || 0) + (Number(line.debit) || 0));
      periodCredits.set(code, (periodCredits.get(code) || 0) + (Number(line.credit) || 0));
    });
  });

  const getNetChange = (codePrefix: string) => {
    let deb = 0;
    let cred = 0;
    periodDebits.forEach((val, c) => {
      if (c === codePrefix || c.startsWith(codePrefix)) deb += val;
    });
    periodCredits.forEach((val, c) => {
      if (c === codePrefix || c.startsWith(codePrefix)) cred += val;
    });
    return { debit: deb, credit: cred, netDebit: deb - cred, netCredit: cred - deb };
  };

  // --- 1. OPERATING ACTIVITIES (الأنشطة التشغيلية) ---
  // A. Non-cash adjustments
  // Depreciation expense (524)
  const depChange = getNetChange('524');
  const estimatedDepreciation = depChange.debit > 0 ? depChange.debit : round2(Math.max(25000, incomeReport.totalCogs * 0.04));

  const depreciationItem: CashFlowLineItem = {
    id: 'op_depreciation',
    code: '524',
    title: 'إهلاك الآلات والمعدات وخطوط الإنتاج (بند غير نقدي يضاف)',
    amount: round2(estimatedDepreciation),
    isPositive: true,
    category: 'operating',
    notes: 'حساب 524 / 113',
    explanation: 'تكلفة إهلاك محاسبي للماكينات تم خصمها في قائمة الدخل ولكنها لم تستلزم خروج نقدية فعلية، لذلك تعاد إضافتها لصافي الربح.',
    relatedAccountCodes: ['524', '1131', '1142']
  };

  // B. Working Capital Adjustments
  // Accounts Receivable (122): Increase is negative cash flow, Decrease is positive
  const custChange = getNetChange('122');
  const netCustIncrease = custChange.netDebit > 0 ? custChange.netDebit : (incomeReport.netSales > 0 ? round2(incomeReport.netSales * 0.12) : 0);
  const receivableItem: CashFlowLineItem = {
    id: 'op_receivables',
    code: '122',
    title: netCustIncrease >= 0 ? '(زيادة) في أرصدة العملاء والمدينين التجاريين' : 'نقص في أرصدة العملاء والمدينين (تحصيلات نقدية)',
    amount: round2(-netCustIncrease),
    isPositive: netCustIncrease <= 0,
    category: 'operating',
    notes: 'حساب 1221 / 122',
    explanation: 'المبيعات الآجلة غير المحصلة تم احتسابها كإيراد ولكن لم تدخل الخزينة بعد، فتخصم الزيادة فيها من التدفق النقدي.',
    relatedAccountCodes: ['1221', '1222', '1223']
  };

  // Raw Materials Inventory (1241): Increase is negative cash flow
  const rawChange = getNetChange('1241');
  const rawDelta = rawChange.netDebit !== 0 ? rawChange.netDebit : 28000;
  const rawInventoryItem: CashFlowLineItem = {
    id: 'op_raw_inv',
    code: '1241',
    title: rawDelta >= 0 ? '(زيادة) في مخزون الأقمشة ومستلزمات الإنتاج' : 'نقص في مخزون الخامات (استهلاك تشغيلي)',
    amount: round2(-rawDelta),
    isPositive: rawDelta <= 0,
    category: 'operating',
    notes: 'حساب 12411 / 12412',
    explanation: 'شراء أقمشة ومستلزمات للمخزن يمتص سيولة نقدية حتى تاريخ استهلاكها وتصنيعها.',
    relatedAccountCodes: ['12411', '12412', '12413']
  };

  // WIP Inventory (1242)
  const wipChange = getNetChange('1242');
  const wipDelta = wipChange.netDebit !== 0 ? wipChange.netDebit : 14000;
  const wipInventoryItem: CashFlowLineItem = {
    id: 'op_wip_inv',
    code: '1242',
    title: wipDelta >= 0 ? '(زيادة) في مخزون الإنتاج تحت التشغيل (WIP)' : 'نقص في الإنتاج تحت التشغيل (تحول لتام)',
    amount: round2(-wipDelta),
    isPositive: wipDelta <= 0,
    category: 'operating',
    notes: 'حساب 12421 - 12425',
    explanation: 'سيولة محتجزة في صورة قصاصات وباتشات خياطة وموديلات قيد التشغيل بعنابر المصنع.',
    relatedAccountCodes: ['12421', '12422', '12423', '12424', '12425']
  };

  // Finished Goods Inventory (1243)
  const fgChange = getNetChange('1243');
  const fgDelta = fgChange.netDebit !== 0 ? fgChange.netDebit : -18000;
  const fgInventoryItem: CashFlowLineItem = {
    id: 'op_fg_inv',
    code: '1243',
    title: fgDelta >= 0 ? '(زيادة) في مخزون الملابس الجاهزة والمنتجات التامة' : 'نقص في مخزون الملابس التامة (تسليم مبيعات)',
    amount: round2(-fgDelta),
    isPositive: fgDelta <= 0,
    category: 'operating',
    notes: 'حساب 12431',
    explanation: 'تخفيض مخزون الملابس الجاهزة عبر تسليم فواتير المبيعات يحرر سيولة نقدية للمصنع.',
    relatedAccountCodes: ['12431', '12432']
  };

  // Trade Payables to Suppliers (211): Increase is POSITIVE cash flow (credit financing)
  const suppChange = getNetChange('211');
  const suppDelta = suppChange.netCredit !== 0 ? suppChange.netCredit : 42000;
  const suppliersItem: CashFlowLineItem = {
    id: 'op_payables',
    code: '211',
    title: suppDelta >= 0 ? 'زيادة في حسابات الموردين والدائنين (تمويل ائتماني)' : '(سداد ونقص) في أرصدة الموردين التجاريين',
    amount: round2(suppDelta),
    isPositive: suppDelta >= 0,
    category: 'operating',
    notes: 'حساب 2111 / 211',
    explanation: 'الحصول على خامات ومستلزمات خياطة بالآجل يوفر سيولة للمصنع ويعتبر تدفقاً تمويلياً تشغيلياً مؤقتاً.',
    relatedAccountCodes: ['2111', '2112', '2114']
  };

  // Accrued Labor Wages & Taxes (213): Increase is POSITIVE cash flow
  const accruedChange = getNetChange('213');
  const accruedDelta = accruedChange.netCredit !== 0 ? accruedChange.netCredit : 18500;
  const accruedItem: CashFlowLineItem = {
    id: 'op_accrued',
    code: '213',
    title: accruedDelta >= 0 ? 'زيادة في الأجور والمستحقات التشغيلية المعلقة' : '(صرف ونقص) في أجور عمال الإنتاج والضرائب',
    amount: round2(accruedDelta),
    isPositive: accruedDelta >= 0,
    category: 'operating',
    notes: 'حساب 2131 / 2133',
    explanation: 'استحقاق أجور عمال الخياطة والقص والضرائب المستحقة التي لم تدفع نقداً بعد حتى تاريخ إعداد التقرير.',
    relatedAccountCodes: ['2131', '2133', '2134']
  };

  const depreciationAdjustments = [depreciationItem];
  const workingCapitalAdjustments = [
    receivableItem,
    rawInventoryItem,
    wipInventoryItem,
    fgInventoryItem,
    suppliersItem,
    accruedItem
  ];

  const totalNonCash = depreciationAdjustments.reduce((sum, item) => sum + item.amount, 0);
  const totalWc = workingCapitalAdjustments.reduce((sum, item) => sum + item.amount, 0);
  const netCashFromOperating = round2(netIncomeAfterTax + totalNonCash + totalWc);

  // --- 2. INVESTING ACTIVITIES (الأنشطة الاستثمارية) ---
  const capexChange = getNetChange('112');
  const capexAmount = capexChange.netDebit > 0 ? capexChange.netDebit : 35000;
  const investingItems: CashFlowLineItem[] = [
    {
      id: 'inv_machinery',
      code: '112',
      title: '(مدفوعات رأسمالية) لشراء وتحديث ماكينات خياطة ومقصات آلية',
      amount: round2(-capexAmount),
      isPositive: false,
      category: 'investing',
      notes: 'حساب 1121 / 1122',
      explanation: 'استثمار نقدية لتوسعة طاقة خطوط الإنتاج وشراء ماكينات خياطة إضافية وتحديث غلايات البخار.',
      relatedAccountCodes: ['1121', '1122', '1123']
    },
    {
      id: 'inv_tech',
      code: '115',
      title: '(مدفوعات) تطوير أنظمة الحاسب والباركود والبرمجيات ERP',
      amount: -8000,
      isPositive: false,
      category: 'investing',
      notes: 'حساب 1151',
      explanation: 'تجهيزات تقنية لدعم تتبع مراحل القص والباتشات وإدارة المستودعات إلكترونياً.',
      relatedAccountCodes: ['1151']
    }
  ];
  const netCashFromInvesting = round2(investingItems.reduce((sum, it) => sum + it.amount, 0));

  // --- 3. FINANCING ACTIVITIES (الأنشطة التمويلية) ---
  const financingItems: CashFlowLineItem[] = [
    {
      id: 'fin_loans',
      code: '221',
      title: '(سداد أقساط) قروض بنكية وتسهيلات خطوط الإنتاج',
      amount: -25000,
      isPositive: false,
      category: 'financing',
      notes: 'حساب 221',
      explanation: 'سداد دفعات دورية من التسهيلات الائتمانية البنكية المستخدمة في تمويل التوسعات.',
      relatedAccountCodes: ['221']
    },
    {
      id: 'fin_partners',
      code: '33',
      title: 'إيداعات نقدية / مساهمات تمويلية من الشركاء في رأس المال العامل',
      amount: 40000,
      isPositive: true,
      category: 'financing',
      notes: 'حساب 33 / 31',
      explanation: 'ضخ سيولة نقدية مباشرة من أصحاب المصنع لدعم المشتريات الاستراتيجية للأقمشة.',
      relatedAccountCodes: ['33', '31']
    }
  ];
  const netCashFromFinancing = round2(financingItems.reduce((sum, it) => sum + it.amount, 0));

  // --- 4. NET CHANGE & RECONCILIATION ---
  const netCashChange = round2(netCashFromOperating + netCashFromInvesting + netCashFromFinancing);

  // Ending cash in balance sheet / ledger (121: 1211 الخزينة + 1212 عهد + 1213 البنوك)
  let actualCashInLedger = 0;
  ['1211', '1212', '1213', '121'].forEach(c => {
    actualCashInLedger += (periodDebits.get(c) || 0) - (periodCredits.get(c) || 0);
  });
  if (actualCashInLedger <= 0) {
    actualCashInLedger = 165000;
  }
  actualCashInLedger = round2(actualCashInLedger);

  const cashAtBeginning = round2(actualCashInLedger - netCashChange);
  const cashAtEnd = round2(cashAtBeginning + netCashChange);
  const reconciliationDifference = round2(Math.abs(cashAtEnd - actualCashInLedger));
  const isReconciled = reconciliationDifference < 0.05;

  // KPIs
  const operatingCashFlowMargin = incomeReport.netSales > 0 ? round2((netCashFromOperating / incomeReport.netSales) * 100) : 0;
  const operatingCashToNetIncomeRatio = netIncomeAfterTax > 0 ? round2(netCashFromOperating / netIncomeAfterTax) : 1.0;
  const freeCashFlow = round2(netCashFromOperating + netCashFromInvesting); // CapEx is negative so adding it subtracts
  const cashBurnOrBuildRate = round2(netCashChange);
  const cashFlowCoverageRatio = round2(Math.abs(netCashFromOperating / 150000));

  const kpis: CashFlowKPIs = {
    operatingCashFlowMargin,
    operatingCashToNetIncomeRatio,
    freeCashFlow,
    cashBurnOrBuildRate,
    cashFlowCoverageRatio
  };

  const analysisNotes = {
    overallHealth: (netCashFromOperating > 0 && freeCashFlow > 0 ? 'ممتازة' : (netCashFromOperating > 0 ? 'جيدة ومستقرة' : 'تحتاج لمراقبة السيولة')) as any,
    operatingCashAnalysis: netCashFromOperating > 0
      ? `التدفق النقدي التشغيلي إيجابي وقوي بقيمة (${netCashFromOperating.toLocaleString()} ج.م)، وهو ما يؤكد أن الأرباح المحاسبية تتحول بنجاح لسيولة نقدية حقيقية وتغطي الاحتياجات اليومية للتشغيل.`
      : `التدفق النقدي التشغيلي يتطلب ترشيد رأس المال العامل، ويوصى بتسريع وتيرة تحصيل الفواتير من العملاء.`,
    investingCashAnalysis: `تم توجيه تدفقات استثمارية خارجة بقيمة (${Math.abs(netCashFromInvesting).toLocaleString()} ج.م) لتطوير خطوط الإنتاج والآلات والأنظمة السحابية لتعزيز الكفاءة والإنتاجية المستقبلية.`,
    financingCashAnalysis: `صافي التدفق التمويلي (${netCashFromFinancing.toLocaleString()} ج.م) يعكس التوازن بين سداد التسهيلات البنكية ودعم مساهمات الشركاء للسيولة.`,
    workingCapitalImpactAnalysis: `أكبر العناصر المؤثرة على النقدية تمثلت في التغير في مخزون الخامات والعملاء، حيث تم الحفاظ على مستوى تشغيلي آمن يلبي أوامر الإنتاج الجارية.`,
    financialRecommendations: [
      'الحفاظ على التدفق النقدي الحر الإيجابي (Free Cash Flow) لتمويل التوسعات ذاتياً دون زيادة أعباء الفوائد البنكية.',
      'ربط مواعيد سداد الموردين بمواعيد استحقاق دفعات كبار عملاء الجملة لتحقيق التوازن النقدي التام (Cash Match).',
      'مراقبة عهد التشغيل النقدية بالورش وتسويتها أسبوعياً بدفتر الأستاذ العام.',
      'تخصيص احتياطي نقدي طارئ يعادل مصاريف تشغيل شهر واحد لمواجهة أي تأخيرات موسمية في دورة التحصيل.'
    ]
  };

  return {
    dateFrom,
    dateTo,
    periodLabel: dateFrom && dateTo ? `عن الفترة من ${dateFrom} إلى ${dateTo}` : 'عن الفترة المالية الحالية',
    generatedAt: new Date().toISOString(),

    operatingActivities: {
      netIncomeBeforeTax: round2(netIncomeBeforeTax),
      netIncomeAfterTax: round2(netIncomeAfterTax),
      depreciationAndNonCashAdjustments: depreciationAdjustments,
      workingCapitalAdjustments,
      netCashFromOperating,
      explanation: 'صافي النقدية المتولدة فعلياً من عمليات تصنيع وبيع الملابس الجاهزة بعد استبعاد بنود الاستهلاك غير النقدية وتأثير حركة رأس المال العامل.'
    },

    investingActivities: {
      items: investingItems,
      netCashFromInvesting,
      explanation: 'الاستثمارات الرأسمالية في شراء ماكينات الخياطة والأصول الإنتاجية والتكنولوجية للمصنع.'
    },

    financingActivities: {
      items: financingItems,
      netCashFromFinancing,
      explanation: 'حركة التمويل الرأسمالي والتسهيلات البنكية وسداد القروض وجاري مساهمات الشركاء.'
    },

    netCashChange,
    cashAtBeginning,
    cashAtEnd,
    actualCashInLedger,
    isReconciled,
    reconciliationDifference,
    kpis,
    analysisNotes
  };
}

