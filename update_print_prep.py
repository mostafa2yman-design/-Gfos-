import re

with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

# Add handleToggleAllAccessories after handleToggleAccessory
toggle_all_func = """  const handleToggleAllAccessories = (batchId: string, isPrepared: boolean) => {
    const updatedBatches = order!.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map((a) => ({
            ...a,
            isPrepared
          })),
        };
      }
      return b;
    });

    setOrder({ ...order!, batches: updatedBatches });
  };"""

pattern = r'(  const handleToggleAccessory = [^\n]+\n.*?setOrder\(\{ \.\.\.order, batches: updatedBatches \}\);\n  \};)'
match = re.search(pattern, content, re.DOTALL)
if match:
    content = content.replace(match.group(1), match.group(1) + '\n\n' + toggle_all_func)

# Add the UI button for "تجهيز كامل"
ui_pattern = r'(                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">\n                      تجهيز الإكسسوارات والطباعة\n                    </h4>)'

ui_replacement = """                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h4 className="font-bold text-slate-800">
                        تجهيز الإكسسوارات
                      </h4>
                      {batch.prepStatus !== "مكتمل" && batch.accessoriesPrep && batch.accessoriesPrep.length > 0 && (
                        <button
                          onClick={() => {
                            const allChecked = calculateBatchAccessories(order, batch).every(a => a.isPrepared);
                            handleToggleAllAccessories(batch.id, !allChecked);
                          }}
                          className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          <CheckSquare className="w-4 h-4" />
                          تحديد الكل / تجهيز كامل
                        </button>
                      )}
                    </div>"""

content = content.replace(
    '                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">\n                      تجهيز الإكسسوارات والطباعة\n                    </h4>',
    ui_replacement
)

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)

print("Done prep sheet modification")
