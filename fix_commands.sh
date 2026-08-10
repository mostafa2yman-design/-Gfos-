# First, insert the import at the top
sed -i '1i import { eventBus } from "./events";' src/lib/productionOrderCommands.ts

# In saveDraft
sed -i 's/return { success: true, data: saved };/eventBus.publish({\n    id: crypto.randomUUID(),\n    type: order.id ? "ProductionOrderSaved" : "ProductionOrderCreated",\n    occurredAt: new Date().toISOString(),\n    aggregateType: "ProductionOrder",\n    aggregateId: saved.id,\n    payload: { status: saved.status }\n  });\n  return { success: true, data: saved };/g' src/lib/productionOrderCommands.ts

# In approveProductionOrder
sed -i 's/return { success: true, data: saved };/eventBus.publish({\n    id: crypto.randomUUID(),\n    type: "ProductionOrderApproved",\n    occurredAt: new Date().toISOString(),\n    aggregateType: "ProductionOrder",\n    aggregateId: saved.id,\n    payload: { status: saved.status }\n  });\n  return { success: true, data: saved };/g' src/lib/productionOrderCommands.ts

# In deleteProductionOrder
sed -i 's/return { success: true, data: null };/eventBus.publish({\n    id: crypto.randomUUID(),\n    type: "ProductionOrderDeleted",\n    occurredAt: new Date().toISOString(),\n    aggregateType: "ProductionOrder",\n    aggregateId: order.id,\n    payload: { orderNumber: order.orderNumber }\n  });\n  return { success: true, data: null };/g' src/lib/productionOrderCommands.ts

