export type OrderStatus = 'مسودة' | 'معتمد' | 'مغلق';

export interface Variant {
  color: string;
  quantity: number;
}

export interface SizeData {
  size: string;
  variants: Variant[];
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
