import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

# Replace availableSizes definition
content = content.replace("import { ProductionOrder, PREDEFINED_SIZES", "import { ProductionOrder")
content = content.replace('import { getBomTemplateForStyle } from "../lib/bom";', 'import { getBomTemplateForStyle } from "../lib/bom";\nimport { getAvailableSizes, addCustomSize } from "../lib/sizes";')

old_available = """  const usedSizes = order.sizes.map((s) => s.size);
  const availableSizes = PREDEFINED_SIZES.filter((s) => !usedSizes.includes(s));"""

new_available = """  const usedSizes = order.sizes.map((s) => s.size);
  const allSizes = getAvailableSizes();
  const availableSizes = allSizes.filter((s) => !usedSizes.includes(s));"""

content = content.replace(old_available, new_available)

# Add state
state_injection = """  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [tempSize, setTempSize] = useState('');"""
content = content.replace('  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);', state_injection)


# Replace the dropdown UI
old_ui = """              {!isReadOnly && availableSizes.length > 0 && (
                <div className="relative" ref={addSizeRef}>
                  <button
                    type="button"

                    onClick={() => setIsAddSizeOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مقاس
                  </button>
                  {isAddSizeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                      {availableSizes.map((sz) => (
                        <button
                          type="button"
                          key={sz}

                          onClick={() => handleAddSize(sz)}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          المقاس {sz}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}"""


# Note X is already imported from lucide-react if not I need to make sure
new_ui = """              {!isReadOnly && (
                <div className="relative" ref={addSizeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddSizeOpen((prev) => !prev);
                      setIsCustomSize(false);
                      setTempSize('');
                    }}
                    className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مقاس
                  </button>
                  {isAddSizeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden flex flex-col max-h-80">
                      {!isCustomSize ? (
                        <div className="overflow-y-auto flex-1">
                          {availableSizes.map((sz) => (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => {
                                handleAddSize(sz);
                                setIsAddSizeOpen(false);
                              }}
                              className="w-full text-right px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                            >
                              المقاس {sz}
                            </button>
                          ))}
                          {availableSizes.length === 0 && (
                            <div className="px-4 py-2 text-sm text-slate-400">لا توجد مقاسات متاحة</div>
                          )}
                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            type="button"
                            onClick={() => setIsCustomSize(true)}
                            className="w-full text-right px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            -- إدخال مقاس يدوياً --
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-50">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المقاس الجديد</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={tempSize}
                              onChange={(e) => setTempSize(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = tempSize.trim();
                                  if (trimmed) {
                                    addCustomSize(trimmed);
                                    handleAddSize(trimmed);
                                    setIsAddSizeOpen(false);
                                    setIsCustomSize(false);
                                  }
                                } else if (e.key === 'Escape') {
                                  setIsCustomSize(false);
                                }
                              }}
                              placeholder="اكتب المقاس..."
                              autoFocus
                              className="w-full pr-2 pl-16 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const trimmed = tempSize.trim();
                                  if (trimmed) {
                                    addCustomSize(trimmed);
                                    handleAddSize(trimmed);
                                    setIsAddSizeOpen(false);
                                    setIsCustomSize(false);
                                  }
                                }}
                                disabled={!tempSize.trim()}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md disabled:opacity-50 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsCustomSize(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}"""

content = content.replace(old_ui, new_ui)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)
print("Done")
