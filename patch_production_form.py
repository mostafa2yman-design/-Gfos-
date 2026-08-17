import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

# Add import
import_target = "import { CopyBomModal } from \"./CopyBomModal\";"
import_replacement = "import { CopyBomModal } from \"./CopyBomModal\";\nimport { CopyOrderModal } from \"./CopyOrderModal\";"
content = content.replace(import_target, import_replacement)

# Add state
state_target = "  const [isCopyBomOpen, setIsCopyBomOpen] = useState(false);"
state_replacement = "  const [isCopyBomOpen, setIsCopyBomOpen] = useState(false);\n  const [isCopyOrderOpen, setIsCopyOrderOpen] = useState(false);"
content = content.replace(state_target, state_replacement)

# Add button
btn_target = """        <div className="flex gap-3">
          {orderId && Cmd.canDeleteProductionOrder(order) && ("""
btn_replacement = """        <div className="flex gap-3">
          {!orderId && !isReadOnly && (
            <button
              type="button"
              onClick={() => setIsCopyOrderOpen(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm font-medium"
            >
              <Copy className="w-4 h-4" />
              استيراد من أمر سابق
            </button>
          )}
          {orderId && Cmd.canDeleteProductionOrder(order) && ("""
content = content.replace(btn_target, btn_replacement)

# Add handler & modal
modal_target = """      <CopyBomModal
        isOpen={isCopyBomOpen}
        onClose={() => setIsCopyBomOpen(false)}
        currentOrderId={orderId || undefined}
        onSelect={(materials, accessories) => {
          setOrder(prev => ({
            ...prev,
            materials: materials,
            accessories: accessories
          }));
          setIsCopyBomOpen(false);
          setSuccess('تم نسخ الخامات والإكسسوارات بنجاح');
        }}
      />"""
modal_replacement = modal_target + """
      <CopyOrderModal
        isOpen={isCopyOrderOpen}
        onClose={() => setIsCopyOrderOpen(false)}
        currentOrderId={orderId || undefined}
        onSelect={(sourceOrder) => {
          setOrder(prev => ({
            ...prev,
            styleName: sourceOrder.styleName,
            category: sourceOrder.category,
            customerName: sourceOrder.customerName,
            sizes: sourceOrder.sizes ? sourceOrder.sizes.map(s => ({
              size: s.size,
              plannedQuantity: s.plannedQuantity,
              // copy only standard properties, clear actual ones
              variants: s.variants.map(v => ({ color: v.color, plannedQuantity: v.plannedQuantity }))
            })) : [],
            materials: sourceOrder.materials ? JSON.parse(JSON.stringify(sourceOrder.materials)) : [],
            accessories: sourceOrder.accessories ? JSON.parse(JSON.stringify(sourceOrder.accessories)) : [],
            printEmbroideryStandardCost: sourceOrder.printEmbroideryStandardCost,
            standardSewingCostPerPiece: sourceOrder.standardSewingCostPerPiece,
          }));
          setIsCopyOrderOpen(false);
          setSuccess('تم استيراد بيانات الأمر السابق بنجاح');
        }}
      />
"""
content = content.replace(modal_target, modal_replacement)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)
