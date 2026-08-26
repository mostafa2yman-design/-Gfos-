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

export async function deleteProductionOrder(order: ProductionOrder): Promise<CommandResult<null>> {
  if (!canDeleteProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حذف أمر الإنتاج في حالته الحالية.' };
  }
  const deleted = await removeOrderFromStorage(order.id);
  if (!deleted) {
    return { success: false, error: 'تعذر حذف أمر الإنتاج، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = await getOrderById(order.id);
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

export async function saveDraft(order: ProductionOrder): Promise<CommandResult<ProductionOrder>> {
  if (!canEditProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حفظ التعديلات لأن الأمر ليس مسودة.' };
  }
  
  // Check if it's new
  const existing = await getOrderById(order.id);
  const isNew = !existing;

  const orderToSave = { ...order, status: 'مسودة' as const };
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) {
    return { success: false, error: savedResult.error || 'تعذر حفظ الأمر كمسودة، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = await getOrderById(order.id);
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

export async function approveProductionOrder(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (order.status !== 'مسودة') {
    return { success: false, error: 'لا يمكن الاعتماد إلا إذا كان مسودة.' };
  }
  
  if (!order.sizes || order.sizes.length === 0) {
    return { success: false, error: 'يجب إضافة مقاس واحد على الأقل للاعتماد.' };
  }
  
  const orderToSave: ProductionOrder = {
    ...order,
    status: 'أمر إنتاج معتمد',
    productionApprovedBy: user,
    productionApprovedAt: new Date().toISOString()
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) {
    return { success: false, error: savedResult.error || 'تعذر حفظ الاعتماد.' };
  }
  
  const verifiedOrder = await getOrderById(order.id);
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
export async function saveCutData(order: ProductionOrder, cutData: CutOrderData): Promise<CommandResult<ProductionOrder>> {
  if (['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status)) {
    return { success: false, error: 'لا يمكن تعديل القص الفعلي بعد الاعتماد.' };
  }
  
  const orderToSave: ProductionOrder = {
    ...order,
    cutData,
    status: order.status === 'أمر إنتاج معتمد' || order.status === 'أمر قص' ? 'القص الفعلي مدخل' : order.status
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ أمر القص.' };
  
  const verifiedOrder = await getOrderById(order.id);
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

export async function approveCutOrder(order: ProductionOrder, cutData: CutOrderData, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const orderToSave: ProductionOrder = {
    ...order,
    cutData: {
      ...cutData,
      approvedBy: user,
      approvedAt: new Date().toISOString()
    },
    status: 'القص معتمد'
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ اعتماد أمر القص.' };
  
  const verifiedOrder = await getOrderById(order.id);
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
export async function saveBatches(order: ProductionOrder, batches: BatchItem[], splitMethod: string): Promise<CommandResult<ProductionOrder>> {
  const orderToSave: ProductionOrder = {
    ...order,
    batches,
    batchSplitMethod: splitMethod as any
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ الباتشات.' };
  
  const verifiedOrder = await getOrderById(order.id);
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

export async function lockBatches(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const orderToSave: ProductionOrder = {
    ...order,
    batchesLockedBy: user,
    batchesLockedAt: new Date().toISOString(),
    status: 'الباتشات مثبتة'
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ تثبيت الباتشات.' };
  
  const verifiedOrder = await getOrderById(order.id);
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
  
  return updatedOrder;
}

export function removeSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  const updatedOrder = {
    ...order,
    sizes: order.sizes.filter(s => s.size !== sizeName)
  };
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

// Prep Commands
export async function savePrepData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  const allCompleted = updatedBatches.every(b => b.prepStatus === 'مكتمل');
  const anyStarted = updatedBatches.some(b => b.prepStatus !== 'جاري' || b.accessoriesPrep.some(a => a.isPrepared));
  
  let newStatus = order.status;
  if (allCompleted) newStatus = 'التجهيز مكتمل';
  else if (anyStarted && order.status === 'الباتشات مثبتة') newStatus = 'التجهيز جاري';

  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: newStatus as any
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ بيانات التجهيز.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  // Only publish if status changed
  if (order.status !== newStatus) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: newStatus === 'التجهيز مكتمل' ? 'PreparationCompleted' : 'PreparationStarted',
      occurredAt: new Date().toISOString(),
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { status: verifiedOrder.status }
    });
  }
  return { success: true, data: verifiedOrder };
}

export async function approveBatchPrep(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const updatedBatches = order.batches!.map(b => {
    if (b.id === batchId) {
      return {
        ...b,
        prepStatus: 'مكتمل' as const,
        prepApprovedBy: user,
        prepApprovedAt: new Date().toISOString()
      };
    }
    return b;
  });

  const allCompleted = updatedBatches.every(b => b.prepStatus === 'مكتمل');
  
  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: allCompleted ? 'التجهيز مكتمل' : 'التجهيز جاري'
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد التجهيز.' };

  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchPreparationCompleted",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { batchId, status: verifiedOrder.status }
  });
  
  if (allCompleted) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: "PreparationCompleted",
      occurredAt: new Date().toISOString(),
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { status: verifiedOrder.status }
    });
  }
  return { success: true, data: verifiedOrder };
}


// Print & Embroidery Commands
export async function savePrintEmbroideryData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  let newStatus = order.status;
  // If previously it was 'التجهيز مكتمل', it might move to 'الطباعة والتطريز جاري' if any batch started
  const anyStarted = updatedBatches.some(b => b.printEmbroideryStatus === 'جاري' || b.printEmbroideryStatus === 'مكتمل');
  const allCompleted = updatedBatches.every(b => b.printEmbroideryStatus === 'مكتمل');

  if (allCompleted) newStatus = 'الطباعة والتطريز مكتمل';
  else if (anyStarted && (order.status === 'التجهيز مكتمل' || order.status === 'الطباعة والتطريز جاري')) newStatus = 'الطباعة والتطريز جاري';

  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: newStatus as any
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ بيانات الطباعة والتطريز.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "PrintEmbroiderySaved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approvePrintEmbroidery(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const updatedBatches = order.batches!.map(b => ({
    ...b,
    printEmbroideryStatus: 'مكتمل' as const
  }));

  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: 'الطباعة والتطريز مكتمل'
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد الطباعة والتطريز.' };

  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "PrintEmbroideryCompleted",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function saveSewingData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    updatedAt: new Date().toISOString()
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ بيانات الخياطة.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: 'SewingSaved',
    occurredAt: new Date().toISOString(),
    aggregateType: 'ProductionOrder',
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approveSewing(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات للاعتماد' };
  }
  
  for (const b of order.batches) {
    if (!b.sewingData) {
      return { success: false, error: `بيانات الخياطة مفقودة للباتش ${b.batchNumber}` };
    }
    const s = b.sewingData;
    if (!s.manufacturingType) {
      return { success: false, error: `نوع التصنيع مفقود للباتش ${b.batchNumber}` };
    }
    if (s.manufacturingType === 'تصنيع داخلي' && !s.sewingGroup) {
      return { success: false, error: `مجموعة الخياطة مفقودة للباتش ${b.batchNumber}` };
    }
    if (s.manufacturingType === 'تصنيع خارجي' && !s.externalManufacturer) {
      return { success: false, error: `جهة التصنيع الخارجي مفقودة للباتش ${b.batchNumber}` };
    }
    if (s.actualCostPerPiece === undefined || s.actualCostPerPiece === null) {
      return { success: false, error: `سعر التصنيع الفعلي مفقود للباتش ${b.batchNumber}` };
    }
    if (!s.actualQuantities || s.actualQuantities.length === 0) {
      return { success: false, error: `الكميات الفعلية مفقودة للباتش ${b.batchNumber}` };
    }
  }

  const updatedBatches = order.batches.map(b => ({
    ...b,
    sewingData: {
      ...b.sewingData!,
      status: 'مكتمل' as const,
      approvedBy: user,
      approvedAt: new Date().toISOString()
    }
  }));

  const orderToSave: ProductionOrder = {
    ...order,
    status: 'الخياطة مكتملة' as any,
    batches: updatedBatches,
    updatedAt: new Date().toISOString()
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد الخياطة.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: 'SewingCompleted',
    occurredAt: new Date().toISOString(),
    aggregateType: 'ProductionOrder',
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approveBatchSewing(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات' };
  }
  
  const b = order.batches.find(b => b.id === batchId);
  if (!b) return { success: false, error: 'الباتش غير موجود' };

  if (!b.sewingData) {
    return { success: false, error: `بيانات الخياطة مفقودة للباتش ${b.batchNumber}` };
  }
  const s = b.sewingData;
  if (!s.manufacturingType) {
    return { success: false, error: `نوع التصنيع مفقود للباتش ${b.batchNumber}` };
  }
  if (s.manufacturingType === 'تصنيع داخلي' && !s.sewingGroup) {
    return { success: false, error: `مجموعة الخياطة مفقودة للباتش ${b.batchNumber}` };
  }
  if (s.manufacturingType === 'تصنيع خارجي' && !s.externalManufacturer) {
    return { success: false, error: `جهة التصنيع الخارجي مفقودة للباتش ${b.batchNumber}` };
  }
  if (s.actualCostPerPiece === undefined || s.actualCostPerPiece === null) {
    return { success: false, error: `سعر التصنيع الفعلي مفقود للباتش ${b.batchNumber}` };
  }
  if (!s.actualQuantities || s.actualQuantities.length === 0) {
    return { success: false, error: `الكميات الفعلية مفقودة للباتش ${b.batchNumber}` };
  }

  const updatedBatches = order.batches.map(batch => {
    if (batch.id === batchId) {
      return {
        ...batch,
        sewingData: {
          ...batch.sewingData!,
          status: 'مكتمل' as const,
          approvedBy: user,
          approvedAt: new Date().toISOString()
        }
      };
    }
    return batch;
  });

  const allSewingCompleted = updatedBatches.every(b => b.sewingData?.status === 'مكتمل');

  const orderToSave: ProductionOrder = {
    ...order,
    status: allSewingCompleted ? 'الخياطة مكتملة' : order.status,
    batches: updatedBatches,
    updatedAt: new Date().toISOString()
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد الخياطة.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  if (allSewingCompleted) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: 'SewingCompleted',
      occurredAt: new Date().toISOString(),
      aggregateType: 'ProductionOrder',
      aggregateId: order.id,
      payload: { 
        orderId: order.id, 
        approvedBy: user,
        batches: updatedBatches.map(b => b.id)
      }
    });
  }

  return { success: true, data: verifiedOrder };
}
