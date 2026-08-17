import re
with open('src/components/SewingForm.tsx', 'r') as f:
    content = f.read()

# Add CheckSquare to lucide-react import
content = content.replace('Check, Save, Scissors, Printer', 'Check, Save, Scissors, Printer, CheckSquare')

new_function = """  const handleReceiveFullBatch = (batchId: string) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          const newActualQuantities: SewingVariantData[] = [];
          b.sizes.forEach(bs => {
            bs.variants.forEach(v => {
              newActualQuantities.push({
                size: bs.size,
                color: v.color,
                actualQuantity: v.quantity
              });
            });
          });
          return {
            ...b,
            sewingData: {
              ...b.sewingData!,
              actualQuantities: newActualQuantities
            }
          };
        }
        return b;
      })
    );
  };

  const handleActualQtyChange = """

content = content.replace("  const handleActualQtyChange = ", new_function)

header_target = """                <div>
                  <h4 className="text-md font-bold text-slate-700 mb-4">
                    الكميات الفعلية المصنعة
                  </h4>"""

header_replacement = """                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-bold text-slate-700">
                      الكميات الفعلية المصنعة
                    </h4>
                    {sData.status !== 'مكتمل' && !isReadOnly && (
                      <button
                        onClick={() => handleReceiveFullBatch(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors shadow-sm"
                        title="استلام كامل الكمية المطوبة تلقائياً"
                      >
                        <CheckSquare className="w-4 h-4" />
                        استلام كامل للباتش
                      </button>
                    )}
                  </div>"""

content = content.replace(header_target, header_replacement)

with open('src/components/SewingForm.tsx', 'w') as f:
    f.write(content)
