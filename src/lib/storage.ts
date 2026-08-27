import { ProductionOrder } from '../types';

const STORAGE_KEY = 'production_orders_v0.4';

export const getOrders = async (): Promise<ProductionOrder[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    
    // Sanitize corrupted orderNumber (was saved as {} due to unhandled Promise)
    return parsed.map((order: any) => {
      if (order.orderNumber && typeof order.orderNumber === 'object') {
        order.orderNumber = `GFOS-FIXED-${Math.floor(Math.random() * 10000)}`;
      }
      return order as ProductionOrder;
    });
  } catch (error) {
    console.error('Failed to parse production orders from storage:', error);
    return [];
  }
};

export const saveOrders = async (orders: ProductionOrder[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Failed to save production orders to storage:', error);
    return false;
  }
};

export const saveOrder = async (order: ProductionOrder): Promise<{ success: boolean; error?: string }> => {
  const orders = await getOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  
  if (existingIndex >= 0) {
    const existingOrder = orders[existingIndex];
    const incomingVersion = order.version || 0;
    const existingVersion = existingOrder.version || 0;
    
    if (incomingVersion < existingVersion) {
      return { success: false, error: "تم تعديل هذا الأمر من مستخدم أو جهاز آخر. يجب تحديث البيانات قبل الحفظ." };
    }
  }

  const updatedOrder: ProductionOrder = {
    ...order,
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  
  let updatedOrders: ProductionOrder[];
  if (existingIndex >= 0) {
    updatedOrders = [...orders];
    updatedOrders[existingIndex] = updatedOrder;
  } else {
    updatedOrders = [...orders, updatedOrder];
  }
  
  const saved = await saveOrders(updatedOrders);
  if (!saved) return { success: false, error: "فشل الحفظ" };
  
  // Dispatch custom event for cross-tab sync if necessary
  window.dispatchEvent(new Event('gfos_storage_update'));
  return { success: true };
};

export const getOrderById = async (id: string): Promise<ProductionOrder | undefined> => {
  const orders = await getOrders();
  return orders.find(o => o.id === id);
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  const orders = await getOrders();
  const updatedOrders = orders.filter(o => o.id !== id);
  return await saveOrders(updatedOrders);
};

export const generateOrderNumber = async (): Promise<string> => {
  try {
    const orders = await getOrders();
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

export const deleteAllOrders = async (): Promise<boolean> => {
  return await saveOrders([]);
};

export const exportData = async (): Promise<string> => {
  const orders = await getOrders();
  return JSON.stringify({
    schemaVersion: '0.4',
    applicationVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    orders
  });
};

export const importData = async (jsonData: string): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.orders || !Array.isArray(data.orders)) {
      return { success: false, error: "تنسيق الملف غير صحيح." };
    }
    
    // Simple validation (can be extended)
    const orders = data.orders as ProductionOrder[];
    await saveOrders(orders);
    
    window.dispatchEvent(new Event('gfos_storage_update'));
    return { success: true, count: orders.length };
  } catch (e) {
    return { success: false, error: "فشل استيراد الملف." };
  }
};

const FACTORY_SETTINGS_KEY = 'gfos_factory_settings';

export const getFactorySettings = (): import('../types').FactorySettings | null => {
  try {
    const data = localStorage.getItem(FACTORY_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to parse factory settings:', error);
    return null;
  }
};

export const saveFactorySettings = (settings: import('../types').FactorySettings): boolean => {
  try {
    localStorage.setItem(FACTORY_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save factory settings:', error);
    return false;
  }
};
