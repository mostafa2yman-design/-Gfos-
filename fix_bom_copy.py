import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

# Add state for modal
state_injection = """  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [isCopyBomOpen, setIsCopyBomOpen] = useState(false);"""

content = content.replace('  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);', state_injection)

# Add import
import_injection = """import { CopyBomModal } from "./CopyBomModal";\nimport { Copy } from "lucide-react";"""
# find import {  Save,
content = content.replace('import {  Save,', import_injection + '\nimport {  Save,')

# Add handleCopyBom
handler_injection = """  const handleCopyBom = (materials: MaterialInstance[], accessories: AccessoryInstance[]) => {
    setOrder(prev => {
      // Create new UUIDs for the copied items to avoid key collisions
      const newMaterials = materials.map(m => ({ ...m, id: crypto.randomUUID() }));
      const newAccessories = accessories.map(a => ({ ...a, id: crypto.randomUUID() }));
      
      // we can merge or replace. the prompt asks to copy BOM. replacing is safer.
      return {
        ...prev,
        materials: newMaterials,
        accessories: newAccessories
      };
    });
    setIsCopyBomOpen(false);
  };
"""

# append handler after handleBomChange
content = re.sub(r'  const handleBomChange = \([\s\S]*?\n  \};\n', lambda m: m.group(0) + '\n' + handler_injection, content)

# Add UI and Modal
ui_injection = """
          <div className="flex justify-between items-center mt-8 mb-4">
            <h2 className="text-xl font-bold text-slate-800">قائمة الخامات والإكسسوارات (BOM)</h2>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsCopyBomOpen(true)}
                className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Copy className="w-4 h-4" />
                نسخ من أمر سابق
              </button>
            )}
          </div>
          
          <BomSection
            order={order}
            onChange={handleBomChange}
            readOnly={isReadOnly}
          />
          
          <CopyBomModal 
            isOpen={isCopyBomOpen}
            onClose={() => setIsCopyBomOpen(false)}
            onSelect={handleCopyBom}
            currentOrderId={order.id}
          />
"""

content = content.replace("""          <BomSection
            order={order}
            onChange={handleBomChange}
            readOnly={isReadOnly}
          />""", ui_injection)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)
print("Done")
