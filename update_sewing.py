import re
with open('src/components/SewingForm.tsx', 'r') as f:
    content = f.read()

# Add approveBatchSewing import if needed
# Wait, let's see if approveSewing is imported. It is imported as Cmd.
# "import * as Cmd from "../lib/productionOrderCommands";" is used in SewingForm.

new_function = """
  const handleApproveBatch = (batchId: string) => {
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من اعتماد الخياطة لهذا الباتش؟ لا يمكن تعديل البيانات بعد الاعتماد.",
      onConfirm: () => {
        const saveResult = Cmd.saveSewingData(order, batches);
        if (saveResult.success && saveResult.data) {
          const approveResult = Cmd.approveBatchSewing(saveResult.data, batchId);
          if (approveResult.success && approveResult.data) {
            setOrder(approveResult.data);
            setToastConfig({
              message: "تم اعتماد خياطة الباتش بنجاح",
              type: "success",
            });
            if (onSaved) onSaved();
          } else {
            setToastConfig({
              message: approveResult.error || "حدث خطأ أثناء الاعتماد",
              type: "error",
            });
          }
        } else {
          setToastConfig({
            message: saveResult.error || "حدث خطأ أثناء الحفظ",
            type: "error",
          });
        }
        setConfirmConfig(null);
      },
    });
  };

  const handleApprove = () => {"""

content = content.replace("  const handleApprove = () => {", new_function)

batch_header_target = """                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-4">
                  باتش: {batch.batchNumber}
                  <button 
                    onClick={() => handlePrint(batch.id)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة الإيصال
                  </button>
                </h3>"""

batch_header_replacement = """                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-4">
                  باتش: {batch.batchNumber}
                  <button 
                    onClick={() => handlePrint(batch.id)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة الإيصال
                  </button>
                  {batch.sewingData?.status !== 'مكتمل' && (
                    <button 
                      onClick={() => handleApproveBatch(batch.id)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      اعتماد الباتش
                    </button>
                  )}
                  {batch.sewingData?.status === 'مكتمل' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                      <Check className="w-4 h-4" />
                      تم الاعتماد
                    </span>
                  )}
                </h3>"""

content = content.replace(batch_header_target, batch_header_replacement)

with open('src/components/SewingForm.tsx', 'w') as f:
    f.write(content)
