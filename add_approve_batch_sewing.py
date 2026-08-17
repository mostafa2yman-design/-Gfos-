import re
with open('src/lib/productionOrderCommands.ts', 'r') as f:
    content = f.read()

new_func = """
export function approveBatchSewing(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): CommandResult<ProductionOrder> {
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

  const saved = persistOrder(orderToSave);
  if (!saved) return { success: false, error: 'تعذر اعتماد الخياطة.' };
  
  const verifiedOrder = getOrderById(order.id);
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
"""

content += new_func

with open('src/lib/productionOrderCommands.ts', 'w') as f:
    f.write(content)
