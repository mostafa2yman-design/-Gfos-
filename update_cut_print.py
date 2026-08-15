import re

with open('src/components/print/CutWorkOrderPrint.tsx', 'r') as f:
    content = f.read()

# Add a section for Actual consumed colors
# I'll place it right after the basic info section or before the signatures.
# Actually, I'll place it after the sizes table.

actual_weight_by_color_html = """      {/* Actual Fabric Used By Color */}
      {order.cutData?.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0 && (
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">بيان المسحوب الفعلي من الأقمشة حسب اللون</h3>
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-right">اللون</th>
                <th className="border border-slate-300 p-2 text-center">المسحوب الفعلي ({order.fabricWeightUnit})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(order.cutData.actualWeightByColor).map(([color, weight]) => (
                <tr key={color}>
                  <td className="border border-slate-300 p-2 font-medium">{color}</td>
                  <td className="border border-slate-300 p-2 text-center text-lg">{weight}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 p-2 text-left">إجمالي المسحوب الفعلي:</td>
                <td className="border border-slate-300 p-2 text-center text-lg text-indigo-700">{order.cutData.actualWeight || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
"""

old_signatures = "      {/* Signatures */}"
new_signatures = actual_weight_by_color_html + "\n" + old_signatures

content = content.replace(old_signatures, new_signatures)

with open('src/components/print/CutWorkOrderPrint.tsx', 'w') as f:
    f.write(content)

print("Done")
