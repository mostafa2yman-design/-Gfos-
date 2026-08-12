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
  cutOrderNumber: string;
  sizes: CutSizeData[];
  actualWeight: number;
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

export interface AccessoryPrepItem {
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

export interface BatchItem {
  id: string;
  batchNumber: string;
  sizes: BatchSizeData[];
  prepStatus: 'جاري' | 'مكتمل';
  prepApprovedBy?: string;
  prepApprovedAt?: string;
  accessoriesPrep: AccessoryPrepItem[];
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
  
  // V0.2 extensions
  materials?: MaterialInstance[];
  accessories?: AccessoryInstance[];
  
  productionApprovedBy?: string;
  productionApprovedAt?: string;
  
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
