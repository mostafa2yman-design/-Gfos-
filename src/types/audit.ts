export type ApprovalActionType =
  | 'treasury_receipt'       // اعتماد سند قبض / تحصيل إيراد
  | 'treasury_payment'       // اعتماد سند صرف / سداد مورد / مصروف
  | 'sales_invoice'          // اعتماد وإصدار فاتورة مبيعات
  | 'sales_return'           // اعتماد مردودات مبيعات
  | 'purchase_invoice'       // اعتماد وإدخال فاتورة مشتريات
  | 'purchase_return'        // اعتماد مردودات مشتريات
  | 'production_order'       // اعتماد أمر إنتاج جديد
  | 'production_stage_cut'   // اعتماد مرحلة القص الفعلي
  | 'production_stage_prep'  // اعتماد صرف وتجهيز المستلزمات
  | 'production_stage_print' // اعتماد الطباعة والتطريز
  | 'production_stage_sewing'// اعتماد الخياطة والتجميع
  | 'production_stage_finish'// اعتماد التشطيب والفنش
  | 'production_stage_iron'  // اعتماد المكواة
  | 'production_stage_pack'  // اعتماد التغليف والباركود
  | 'inventory_adjustment'   // اعتماد تسوية جردية مخزنية
  | 'journal_entry';         // اعتماد قيد يومية محاسبي

export interface SystemApprovalLog {
  id: string;
  timestamp: string;      // ISO string (2026-09-27T14:30:00.000Z)
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM:SS
  actionType: ApprovalActionType;
  actionTypeLabel: string; // e.g. "سند قبض / تحصيل", "فاتورة مبيعات", "اعتماد مرحلة القص"
  documentId: string;     // Unique id of the related record
  documentNumber: string; // e.g. "REC-2026-001", "SAL-2026-004", "ORD-101", "JV-2026-0012"
  title: string;          // عنوان الحركة المختصر
  details: string;        // تفاصيل الحركة والبيان
  amount?: number;        // القيمة المالية إن وجدت
  quantity?: number;      // الكمية بالقطع أو الأمتار
  counterpartyName?: string; // اسم العميل أو المورد أو المستفيد
  costCenter?: string;    // مركز التكلفة أو خط الإنتاج
  
  // User who approved
  userId: string;
  userName: string;
  userRole: string;
  userRoleLabel: string;
  
  status: 'معتمد' | 'ملغي' | 'قيد المراجعة';
  verificationCode: string; // الرمز المرجعي المشفر للاعتماد (مثال: APP-9821-X4)
  notes?: string;
}

export interface AuditMetrics {
  totalApprovalsCount: number;
  todayApprovalsCount: number;
  thisMonthApprovalsCount: number;
  approvalsByAction: Record<string, number>;
  approvalsByUser: Record<string, number>;
  totalApprovedFinancialValue: number;
}
