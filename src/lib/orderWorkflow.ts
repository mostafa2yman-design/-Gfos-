import { OrderStatus } from '../types';

export const CUT_ENABLED_STATUSES: OrderStatus[] = [
  'أمر إنتاج معتمد', 'أمر قص', 'القص الفعلي مدخل', 'القص معتمد', 
  'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'
];

export const BATCHES_ENABLED_STATUSES: OrderStatus[] = [
  'القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'
];

export const PREP_ENABLED_STATUSES: OrderStatus[] = [
  'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 
  'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'مغلق'
];

export const PRINT_ENABLED_STATUSES: OrderStatus[] = [
  'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'مغلق'
];

export const SEW_ENABLED_STATUSES: OrderStatus[] = [
  'الطباعة والتطريز مكتمل', 'مغلق'
];

export const isCutEnabled = (status: OrderStatus) => CUT_ENABLED_STATUSES.includes(status);
export const isBatchesEnabled = (status: OrderStatus) => BATCHES_ENABLED_STATUSES.includes(status);
export const isPrepEnabled = (status: OrderStatus) => PREP_ENABLED_STATUSES.includes(status);
export const isPrintEnabled = (status: OrderStatus) => PRINT_ENABLED_STATUSES.includes(status);
export const isSewEnabled = (status: OrderStatus) => SEW_ENABLED_STATUSES.includes(status);

export type TabType = 'production' | 'cut' | 'batches' | 'prep' | 'print' | 'sew';

export const getDefaultTabForStatus = (status: OrderStatus): TabType => {
  if (['أمر إنتاج معتمد', 'أمر قص', 'القص الفعلي مدخل'].includes(status)) {
    return 'cut';
  } else if (['القص معتمد', 'تقسيم الباتشات'].includes(status)) {
    return 'batches';
  } else if (['الطباعة والتطريز مكتمل', 'الطباعة والتطريز جاري'].includes(status)) {
    return 'print';
  } else if (['الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل'].includes(status)) {
    return 'prep';
  } else {
    return 'production';
  }
};
