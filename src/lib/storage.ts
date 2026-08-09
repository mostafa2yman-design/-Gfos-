import { ProductionOrder } from '../types';

const STORAGE_KEY = 'production_orders_v0.1';

export const getOrders = (): ProductionOrder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('Failed to parse production orders from storage:', error);
    return [];
  }
};

export const saveOrders = (orders: ProductionOrder[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Failed to save production orders to storage:', error);
    return false;
  }
};

export const saveOrder = (order: ProductionOrder): boolean => {
  try {
    const orders = getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    
    const updatedOrder: ProductionOrder = {
      ...order,
      updatedAt: new Date().toISOString()
    };
    
    let updatedOrders: ProductionOrder[];
    if (existingIndex >= 0) {
      updatedOrders = [...orders];
      updatedOrders[existingIndex] = updatedOrder;
    } else {
      updatedOrders = [...orders, updatedOrder];
    }
    
    return saveOrders(updatedOrders);
  } catch (error) {
    console.error('Failed to save order:', error);
    return false;
  }
};

export const getOrderById = (id: string): ProductionOrder | undefined => {
  try {
    return getOrders().find(o => o.id === id);
  } catch (error) {
    console.error('Failed to get order by id:', error);
    return undefined;
  }
};

export const deleteOrder = (id: string): boolean => {
  try {
    const orders = getOrders();
    const updatedOrders = orders.filter(o => o.id !== id);
    return saveOrders(updatedOrders);
  } catch (error) {
    console.error('Failed to delete order:', error);
    return false;
  }
};

export const generateOrderNumber = (): string => {
  try {
    const orders = getOrders();
    const year = new Date().getFullYear();
    const yearPrefix = `PO-${year}-`;
    
    let maxSeq = 0;
    orders.forEach(o => {
      if (o.orderNumber && o.orderNumber.startsWith(yearPrefix)) {
        const seqStr = o.orderNumber.substring(yearPrefix.length);
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${yearPrefix}${nextSeq.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Failed to generate order number:', error);
    const year = new Date().getFullYear();
    return `PO-${year}-0001`;
  }
};

export const initializeDummyData = () => {
  try {
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
  } catch (error) {
    console.error('Failed to initialize dummy data:', error);
  }
};
