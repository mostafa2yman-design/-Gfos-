import { ProductionOrder, SizeData, Variant } from '../types';
import { saveOrder as persistOrder, getOrderById, deleteOrder as removeOrderFromStorage } from './storage';

export type CommandResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function canEditProductionOrder(order: ProductionOrder): boolean {
  return order.status === 'مسودة';
}

export function canDeleteProductionOrder(order: ProductionOrder): boolean {
  return ['مسودة', 'أمر إنتاج معتمد', 'أمر قص', 'القص الفعلي مدخل'].includes(order.status);
}

export function deleteProductionOrder(order: ProductionOrder): CommandResult<null> {
  if (!canDeleteProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حذف أمر الإنتاج في حالته الحالية.' };
  }
  const deleted = removeOrderFromStorage(order.id);
  if (!deleted) {
    return { success: false, error: 'تعذر حذف أمر الإنتاج، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = getOrderById(order.id);
  if (verifiedOrder) {
    return { success: false, error: 'تمت محاولة الحذف لكن الأمر لا يزال موجوداً.' };
  }
  
  return { success: true, data: null };
}

export function saveDraft(order: ProductionOrder): CommandResult<ProductionOrder> {
  if (!canEditProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حفظ التعديلات لأن الأمر ليس مسودة.' };
  }
  
  const orderToSave = { ...order, status: 'مسودة' as const };
  const saved = persistOrder(orderToSave);
  if (!saved) {
    return { success: false, error: 'تعذر حفظ الأمر كمسودة، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) {
    return { success: false, error: 'تم الحفظ لكن تعذر استرجاع البيانات المؤكدة.' };
  }
  
  return { success: true, data: verifiedOrder };
}

export function approveProductionOrder(order: ProductionOrder, user: string = 'المستخدم الحالي'): CommandResult<ProductionOrder> {
  if (order.status !== 'مسودة') {
    return { success: false, error: 'لا يمكن اعتماد أمر الإنتاج إلا إذا كان مسودة.' };
  }
  
  if (!order.sizes || order.sizes.length === 0) {
    return { success: false, error: 'يجب إضافة مقاس واحد على الأقل لاعتماد الأمر.' };
  }
  
  const orderToSave: ProductionOrder = {
    ...order,
    status: 'أمر إنتاج معتمد',
    productionApprovedBy: user,
    productionApprovedAt: new Date().toISOString()
  };
  
  const saved = persistOrder(orderToSave);
  if (!saved) {
    return { success: false, error: 'تعذر حفظ اعتماد أمر الإنتاج.' };
  }
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) {
    return { success: false, error: 'تم الاعتماد لكن تعذر استرجاع البيانات المؤكدة.' };
  }
  
  return { success: true, data: verifiedOrder };
}

export function addSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  const newSize: SizeData = {
    size: sizeName,
    variants: []
  };
  return {
    ...order,
    sizes: [...order.sizes, newSize]
  };
}

export function removeSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.filter(s => s.size !== sizeName)
  };
}

export function copySize(order: ProductionOrder, sourceSizeName: string, targetSizeName: string): ProductionOrder {
  const sourceSize = order.sizes.find(s => s.size === sourceSizeName);
  if (!sourceSize) return order;
  
  const copiedVariants: Variant[] = sourceSize.variants.map(v => ({
    ...v,
  }));
  
  const newSize: SizeData = {
    size: targetSizeName,
    variants: copiedVariants
  };
  
  return {
    ...order,
    sizes: [...order.sizes, newSize]
  };
}

export function addVariant(order: ProductionOrder, sizeName: string, color: string, quantity: number): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        const newVariant: Variant = {
          color,
          quantity
        };
        return { ...size, variants: [...size.variants, newVariant] };
      }
      return size;
    })
  };
}

export function removeVariant(order: ProductionOrder, sizeName: string, variantIndex: number): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        return { ...size, variants: size.variants.filter((_, idx) => idx !== variantIndex) };
      }
      return size;
    })
  };
}

export function updateVariantQuantity(order: ProductionOrder, sizeName: string, variantIndex: number, quantity: number): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        return {
          ...size,
          variants: size.variants.map((v, idx) => {
            if (idx === variantIndex) {
              return { ...v, quantity };
            }
            return v;
          })
        };
      }
      return size;
    })
  };
}

export function updateVariantColor(order: ProductionOrder, sizeName: string, variantIndex: number, color: string): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        return {
          ...size,
          variants: size.variants.map((v, idx) => {
            if (idx === variantIndex) {
              return { ...v, color };
            }
            return v;
          })
        };
      }
      return size;
    })
  };
}
