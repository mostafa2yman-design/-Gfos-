import re
with open('src/components/CutOrderForm.tsx', 'r') as f:
    content = f.read()

old_weight_section = """            <h4 className="text-md font-bold text-slate-800 mb-4">
              الوزن الفعلي المسحوب لكل لون (كجم)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colors.map((color: string) => (
                <div key={color}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {color}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={cutData.actualWeightByColor?.[color] || ""}
                    onChange={(e) =>
                      handleWeightChange(color, parseFloat(e.target.value) || 0)
                    }
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded text-sm ${isReadOnly ? "bg-slate-50 text-slate-700" : "bg-white focus:ring-2 focus:ring-indigo-500"}`}
                    placeholder="الوزن الفعلي"
                  />
                </div>
              ))}
            </div>"""

new_weight_section = """            <h4 className="text-md font-bold text-slate-800 mb-4">
              مسحوبات الأقمشة من المخزن لكل لون (كجم)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {colors.map((color: string) => {
                const reqFabric = fabricSummary.colors.find((c: any) => c.color === color)?.requiredFabric;
                return (
                  <div key={color} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-bold text-slate-800 mb-3 text-center border-b pb-2">
                      {color}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-xs text-slate-500 mb-1">المطلوب المعياري</span>
                        <div className="px-3 py-2 bg-white border border-slate-200 rounded text-sm text-center font-medium text-slate-600">
                          {reqFabric ? reqFabric.toFixed(3) : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 mb-1">المسحوب الفعلي</span>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={cutData.actualWeightByColor?.[color] || ""}
                          onChange={(e) =>
                            handleWeightChange(color, parseFloat(e.target.value) || 0)
                          }
                          disabled={isReadOnly}
                          className={`w-full px-3 py-2 border rounded text-sm text-center ${isReadOnly ? "bg-slate-100 text-slate-700" : "bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"}`}
                          placeholder="الفعلي"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>"""

content = content.replace(old_weight_section, new_weight_section)

with open('src/components/CutOrderForm.tsx', 'w') as f:
    f.write(content)
