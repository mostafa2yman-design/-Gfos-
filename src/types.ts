export type StageStatus = 'لم يبدأ' | 'جاري' | 'مكتمل';

export interface StageInfo {
  status: StageStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export type OrderStatus = 
  | 'مسودة'
  | 'أمر إنتاج معتمد'
  | 'أمر قص'
  | 'القص الفعلي مدخل'
  | 'القص معتمد'
  | 'تقسيم الباتشات'
  | 'الباتشات مثبتة'
  | 'التجهيز جاري'
  | 'التجهيز مكتمل'
  | 'الطباعة والتطريز جاري'
  | 'الطباعة والتطريز مكتمل'
  | 'الخياطة مكتملة'
  | 'التشطيب جاري'
  | 'التشطيب مكتمل'
  | 'المكواة جاري'
  | 'المكواة مكتملة'
  | 'مغلق'
  | 'معتمد'; // keeping معتمد for backwards compatibility if needed, though replaced by 'أمر إنتاج معتمد'

export interface Variant {
  color: string;
  quantity: number;
}

export interface SizeData {
  size: string;
  variants: Variant[];
}

export type StandardMethod = 'موحد' | 'حسب المقاس';

export interface SizeStandard {
  size: string;
  standard: number;
}

export interface MaterialInstance {
  id: string;
  name: string;
  type: string;
  unit: string;
  standardMethod: StandardMethod;
  unifiedStandard: number;
  sizeStandards: SizeStandard[];
  standardPrice?: number;
}

export interface AccessoryInstance {
  id: string;
  name: string;
  type: string;
  unit: string;
  standardMethod: StandardMethod;
  unifiedStandard: number;
  sizeStandards: SizeStandard[];
  standardPrice?: number;
}

export interface CutVariant {
  color: string;
  plannedQuantity: number;
  actualQuantity: number;
}

export interface CutSizeData {
  size: string;
  variants: CutVariant[];
}

export interface CutOrderData {
  cutterName?: string;
  actualFabricName?: string;
  cutOrderNumber: string;
  sizes: CutSizeData[];
  actualWeight: number;
  actualWeightByColor?: Record<string, number>;
  actualCostPerPiece?: number;
  weightUnit: string;
  weightDate?: string;
  weightUser?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type BatchSplitMethod = 'حسب اللون' | 'حسب المقاس';

export interface BatchVariant {
  color: string;
  quantity: number;
}

export interface BatchSizeData {
  size: string;
  variants: BatchVariant[];
}


export type PrintEmbroideryExecutionType = 'بدون طباعة / تطريز' | 'طباعة' | 'تطريز' | 'طباعة + تطريز';

export interface PrintDetails {
  designName: string;
  placement: string;
  colors: string;
  colorCount: number;
  notes: string;
}

export interface EmbroideryDetails {
  designName: string;
  placement: string;
  threadColors: string;
  colorCount: number;
  notes: string;
}

export type BatchPrintEmbroideryStatus = 'لم يبدأ' | 'جاري' | 'مكتمل';

export interface AccessoryPrepItem {
  actualAccessoryName?: string;
  accessoryId: string;
  accessoryName: string;
  unit: string;
  requiredQuantity: number;
  actualPrepared: number;
  waste: number;
  isPrepared: boolean;
  notes?: string;
  preparedBy?: string;
  preparedAt?: string;
}


export type SewingManufacturingType = 'تصنيع داخلي' | 'تصنيع خارجي';

export interface SewingVariantData {
  color: string;
  size: string;
  actualQuantity: number;
}

export interface FinishingVariantData {
  size: string;
  color: string;
  actualQuantity?: number; quantity?: number; // Actual quantity finished
}

export interface FinishingData {
  workerName?: string; // for finishing
  status: 'لم يبدأ' | 'جاري' | 'مكتمل';
  actualCostPerPiece?: number;
  actualQuantities: FinishingVariantData[];
  approvedBy?: string;
  approvedAt?: string;
}


export interface IroningVariantData {
  size: string;
  color: string;
  actualQuantity?: number; quantity?: number;
}

export interface IroningData {
  workerName?: string; // for ironing
  status: 'لم يبدأ' | 'جاري' | 'مكتمل';
  actualCostPerPiece?: number;
  actualQuantities: IroningVariantData[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface SewingData {
  manufacturingType?: SewingManufacturingType;
  sewingGroup?: string;
  externalManufacturer?: string;
  actualCostPerPiece?: number;
  actualQuantities: SewingVariantData[];
  status: 'لم يبدأ' | 'جاري' | 'مكتمل';
  approvedBy?: string;
  approvedAt?: string;
}

export interface BatchItem {
  id: string;
  batchNumber: string;
  sizes: BatchSizeData[];
  prepStatus: 'جاري' | 'مكتمل';
  prepApprovedBy?: string;
  prepApprovedAt?: string;
  accessoriesPrep: AccessoryPrepItem[];
  printEmbroideryStatus?: BatchPrintEmbroideryStatus;
  printApprovedBy?: string;
  printApprovedAt?: string;
  executionType?: PrintEmbroideryExecutionType;
  printDetails?: PrintDetails;
  embroideryDetails?: EmbroideryDetails;
  sewingData?: SewingData;
  finishingData?: FinishingData;
  ironingData?: IroningData;
  printEmbroideryCost?: {
    standardCost: number;
    actualCost?: number;
  };
}


export interface PackingInvoiceVariant {
  size: string;
  color: string;
  quantity: number;
}

export interface PackingInvoice {
  id: string;
  date: string;
  customerName: string;
  variants: PackingInvoiceVariant[];
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  styleName: string;
  category: string;
  customerName: string;
  status: OrderStatus;
  sizes: SizeData[];
  createdAt: string;
  updatedAt: string;
  
  // V0.4 Versioning and Independent Stages
  version?: number;
  stageStatuses?: {
    production?: StageInfo;
    cut?: StageInfo;
    batches?: StageInfo;
    prep?: StageInfo;
    print?: StageInfo;
    sewing?: StageInfo;
  };
  // V0.2 extensions
  materials?: MaterialInstance[];
  accessories?: AccessoryInstance[];
  
  productionApprovedBy?: string;
  productionApprovedAt?: string;
  materialsApprovedBy?: string;
  materialsApprovedAt?: string;
  cutApprovedBy?: string;
  cutApprovedAt?: string;
  prepApprovedBy?: string;
  prepApprovedAt?: string;
  printEmbroideryApprovedBy?: string;
  printEmbroideryApprovedAt?: string;
  printEmbroideryStandardCost?: number;
  standardSewingCostPerPiece?: number;
  standardFinishingCostPerPiece?: number;
  standardCutCostPerPiece?: number;
  standardIroningCostPerPiece?: number;
  sellingPrice?: number;
  finishingInstructions?: string;
  ironingInstructions?: string;
  packingInstructions?: string;
  packingInvoices?: PackingInvoice[];

  
  cutData?: CutOrderData;
  
  batchSplitMethod?: BatchSplitMethod;
  batches?: BatchItem[];
  batchesLockedBy?: string;
  batchesLockedAt?: string;
}

export const PREDEFINED_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '4', '6', '8', '10', '12', '14', '16'
];

export const PREDEFINED_COLORS = [
  'أسود', 'أبيض', 'كحلي', 'رمادي', 'أحمر', 'بيج', 'أخضر'
];

export const CATEGORIES = [
  'رجالي', 'حريمي', 'أطفال', 'أخرى'
];

export interface FactorySettings {
  name: string;
  address: string;
  phones: string;
  logoUrl: string | null;
}

// --- Accounting Configuration Types ---

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  description?: string;
  isActive: boolean;
}

export interface CustomerSupplier {
  id: string;
  type: 'customer' | 'supplier' | 'both';
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  isActive: boolean;
  linkedAccountId?: string;
}

export interface MaterialItem {
  id: string;
  type: 'fabric' | 'accessory';
  name: string;
  code?: string;
  unit: string;
  defaultCost?: number;
  isActive: boolean;
  linkedExpenseAccountId?: string; 
}

export interface LaborProfile {
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
}

export interface OperationalGroup {
  id: string;
  name: string;
  type: 'internal' | 'external';
  specialty: string;
  contactPerson?: string;
  phone?: string;
  isActive: boolean;
  linkedAccountId?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}
