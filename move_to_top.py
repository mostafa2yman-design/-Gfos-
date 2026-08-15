import re

# Fix VariantRow.tsx
with open('src/components/form/VariantRow.tsx', 'r') as f:
    variant_content = f.read()

old_variant = """            {/* Show available predefined/saved colors */}
            {availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
            
            {!readOnly && (
              <option value="CUSTOM_COLOR_ENTRY" className="font-bold bg-indigo-50 text-indigo-700">
                -- إدخال لون يدوياً --
              </option>
            )}"""

new_variant = """            {!readOnly && (
              <option value="CUSTOM_COLOR_ENTRY" className="font-bold bg-indigo-50 text-indigo-700">
                -- إدخال لون يدوياً --
              </option>
            )}
            
            {/* Show available predefined/saved colors */}
            {availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}"""

variant_content = variant_content.replace(old_variant, new_variant)
with open('src/components/form/VariantRow.tsx', 'w') as f:
    f.write(variant_content)


# Fix ProductionOrderForm.tsx
with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    prod_content = f.read()

old_prod = """                        <div className="overflow-y-auto flex-1">
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
                        </div>"""

new_prod = """                        <div className="overflow-y-auto flex-1">
                          <button
                            type="button"
                            onClick={() => setIsCustomSize(true)}
                            className="w-full text-right px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            -- إدخال مقاس يدوياً --
                          </button>
                          <div className="border-b border-slate-100 my-1"></div>
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
                        </div>"""

prod_content = prod_content.replace(old_prod, new_prod)
with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(prod_content)

print("Done")
