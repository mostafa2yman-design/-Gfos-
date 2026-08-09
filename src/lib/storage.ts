import { ProductionOrder } from '../types';

const STORAGE_KEY = 'production_orders_v0.1';

export const getOrders = (): ProductionOrder[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveOrders = (orders: ProductionOrder[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

export const saveOrder = (order: ProductionOrder) => {
  const orders = getOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  
  order.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }
  
  saveOrders(orders);
};

export const getOrderById = (id: string): ProductionOrder | undefined => {
  return getOrders().find(o => o.id === id);
};

export const generateOrderNumber = (): string => {
  const orders = getOrders();
  const year = new Date().getFullYear();
  const currentYearOrders = orders.filter(o => o.orderNumber.includes(`PO-${year}-`));
  const nextSeq = currentYearOrders.length + 1;
  return `PO-${year}-${nextSeq.toString().padStart(4, '0')}`;
};

export const initializeDummyData = () => {
  const orders = getOrders();
  if (orders.length === 0) {
    const dummyOrder: ProductionOrder = {
      id: crypto.randomUUID(),
      orderNumber: 'PO-2026-0001',
      orderDate: new Date().toISOString().split('T')[0],
      styleName: 'ترنج رجالي موديل تجريبي',
      category: 'رجالي',
      customerName: 'عميل تجريبي',
      status: 'مسودة',
      sizes: [
        {
          size: 'M',
          variants: [
            { color: 'أسود', quantity: 50 },
            { color: 'أبيض', quantity: 40 },
            { color: 'كحلي', quantity: 30 }
          ]
        },
        {
          size: 'L',
          variants: [
            { color: 'أسود', quantity: 60 },
            { color: 'أبيض', quantity: 50 },
            { color: 'كحلي', quantity: 40 }
          ]
        },
        {
          size: 'XL',
          variants: [
            { color: 'أسود', quantity: 70 },
            { color: 'أبيض', quantity: 60 },
            { color: 'كحلي', quantity: 50 }
          ]
        },
        {
          size: 'XXL',
          variants: [
            { color: 'أسود', quantity: 40 },
            { color: 'أبيض', quantity: 30 },
            { color: 'كحلي', quantity: 20 }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveOrders([dummyOrder]);
  }
};
