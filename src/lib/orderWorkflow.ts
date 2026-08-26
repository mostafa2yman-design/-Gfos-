import { OrderStatus } from '../types';

export const isCutEnabled = (status: OrderStatus) => true;
export const isBatchesEnabled = (status: OrderStatus) => true;
export const isPrepEnabled = (status: OrderStatus) => true;
export const isPrintEnabled = (status: OrderStatus) => true;
export const isSewEnabled = (status: OrderStatus) => true;

export type TabType = 'production' | 'cut' | 'batches' | 'prep' | 'print' | 'sew';

export const getDefaultTabForStatus = (status: OrderStatus): TabType => {
  return 'production'; // Just default to production tab
};
