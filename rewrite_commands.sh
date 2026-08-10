cat << 'INNEREOF' > src/lib/productionOrderCommands.ts
import { eventBus } from "./events";
import { ProductionOrder, SizeData, Variant, CutOrderData, BatchItem } from '../types';
import { saveOrder as persistOrder, getOrderById, deleteOrder as removeOrderFromStorage, getOrders } from './storage';

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
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "ProductionOrderDeleted",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { orderNumber: order.orderNumber }
  });
  return { success: true, data: null };
}

export function saveDraft(order: ProductionOrder): CommandResult<ProductionOrder> {
  if (!canEditProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حفظ التعديلات لأن الأمر ليس مسودة.' };
  }
  
  // Check if it's new
  const isNew = !getOrderById(order.id);

  const orderToSave = { ...order, status: 'مسودة' as const };
  const saved = persistOrder(orderToSave);
  if (!saved) {
    return { success: false, error: 'تعذر حفظ الأمر كمسودة، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) {
    return { success: false, error: 'تم الحفظ لكن تعذر استرجاع البيانات المؤكدة.' };
  }
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: isNew ? "ProductionOrderCreated" : "ProductionOrderSaved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

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
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "ProductionOrderApproved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

// Cut commands
export function saveCutData(order: ProductionOrder, cutData: CutOrderData): CommandResult<ProductionOrder> {
  if (['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status)) {
    return { success: false, error: 'لا يمكن تعديل القص الفعلي بعد الاعتماد.' };
  }
  
  const orderToSave: ProductionOrder = {
    ...order,
    cutData,
    status: order.status === 'أمر إنتاج معتمد' || order.status === 'أمر قص' ? 'القص الفعلي مدخل' : order.status
  };
  
  const saved = persistOrder(orderToSave);
  if (!saved) return { success: false, error: 'تعذر حفظ أمر القص.' };
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "CutActualEntered",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export function approveCutOrder(order: ProductionOrder, cutData: CutOrderData, user: string = 'المستخدم الحالي'): CommandResult<ProductionOrder> {
  const orderToSave: ProductionOrder = {
    ...order,
    cutData: {
      ...cutData,
      approvedBy: user,
      approvedAt: new Date().toISOString()
    },
    status: 'القص معتمد'
  };
  
  const saved = persistOrder(orderToSave);
  if (!saved) return { success: false, error: 'تعذر حفظ اعتماد أمر القص.' };
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "CutOrderApproved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

// Batches commands
export function saveBatches(order: ProductionOrder, batches: BatchItem[], splitMethod: string): CommandResult<ProductionOrder> {
  const orderToSave: ProductionOrder = {
    ...order,
    batches,
    batchSplitMethod: splitMethod as any
  };
  
  const saved = persistOrder(orderToSave);
  if (!saved) return { success: false, error: 'تعذر حفظ الباتشات.' };
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchSplitCompleted",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export function lockBatches(order: ProductionOrder, user: string = 'المستخدم الحالي'): CommandResult<ProductionOrder> {
  const orderToSave: ProductionOrder = {
    ...order,
    batchesLockedBy: user,
    batchesLockedAt: new Date().toISOString(),
    status: 'الباتشات مثبتة'
  };
  
  const saved = persistOrder(orderToSave);
  if (!saved) return { success: false, error: 'تعذر حفظ تثبيت الباتشات.' };
  
  const verifiedOrder = getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchesLocked",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export function addSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  const newSize: SizeData = {
    size: sizeName,
    variants: []
  };
  
  const updatedOrder = {
    ...order,
    sizes: [...order.sizes, newSize]
  };
  
  // Notice we only publish if the order exists (not a new unsaved draft)
  if (getOrderById(order.id)) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: "ProductionOrderSizeAdded",
      occurredAt: new Date().toISOString(),
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { sizeName }
    });
  }

  return updatedOrder;
}

export function removeSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  const updatedOrder = {
    ...order,
    sizes: order.sizes.filter(s => s.size !== sizeName)
  };
  
  if (getOrderById(order.id)) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: "ProductionOrderSizeRemoved",
      occurredAt: new Date().toISOString(),
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { sizeName }
    });
  }

  return updatedOrder;
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
  
  const updatedOrder = {
    ...order,
    sizes: [...order.sizes, newSize]
  };
  
  if (getOrderById(order.id)) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: "ProductionOrderSizeCopied",
      occurredAt: new Date().toISOString(),
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { sourceSizeName, targetSizeName }
    });
  }

  return updatedOrder;
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
INNEREOF
