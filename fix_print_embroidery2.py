import re

with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

# Add printingBatchId state
old_state = """  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {"""
new_state = """  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);

  useEffect(() => {"""
content = content.replace(old_state, new_state)

# Add "Copy details" function
copy_func = """
  const handleCopyDetails = (sourceBatchId: string) => {
    const sourceBatch = batches.find(b => b.id === sourceBatchId);
    if (!sourceBatch) return;

    const updatedBatches = batches.map(b => {
      if (b.id === sourceBatchId) return b;
      return {
        ...b,
        executionType: sourceBatch.executionType,
        printDetails: sourceBatch.printDetails ? { ...sourceBatch.printDetails } : undefined,
        embroideryDetails: sourceBatch.embroideryDetails ? { ...sourceBatch.embroideryDetails } : undefined,
        printEmbroideryCost: sourceBatch.printEmbroideryCost ? { ...sourceBatch.printEmbroideryCost } : undefined
      };
    });
    setBatches(updatedBatches);
    setToastConfig({ message: "تم نسخ تفاصيل الطباعة والتطريز لجميع الباتشات بنجاح", type: "success" });
  };
"""

content = content.replace("  const handleCostChange = (", copy_func + "\n  const handleCostChange = (")

# Update global Print Button
old_global_print = """            <button
              onClick={printDocument}
              className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
            >
              <Printer className="w-4 h-4" />
              طباعة أمر تشغيل
            </button>"""
# Remove global print button
content = content.replace(old_global_print, "")

# Update the print function
old_print_func = """  const printDocument = () => {
    window.print();
  };"""
new_print_func = """  const printDocument = (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };"""
content = content.replace(old_print_func, new_print_func)

# Update the import
import_line = 'import { Check, Save, Printer } from "lucide-react";'
new_import_line = 'import { Check, Save, Printer, Copy } from "lucide-react";'
content = content.replace(import_line, new_import_line)

# Update Batch Header
old_batch_header = """                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        باتش رقم: {batch.batchNumber}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        الحالة:{" "}
                        <span
                          className={`font-medium ${batch.printEmbroideryStatus === "مكتمل" ? "text-emerald-600" : batch.printEmbroideryStatus === "جاري" ? "text-amber-600" : "text-slate-600"}`}
                        >
                          {batch.printEmbroideryStatus || "لم يبدأ"}
                        </span>
                      </p>
                    </div>
                  </div>"""

new_batch_header = """                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        باتش رقم: {batch.batchNumber}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        الحالة:{" "}
                        <span
                          className={`font-medium ${batch.printEmbroideryStatus === "مكتمل" ? "text-emerald-600" : batch.printEmbroideryStatus === "جاري" ? "text-amber-600" : "text-slate-600"}`}
                        >
                          {batch.printEmbroideryStatus || "لم يبدأ"}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {!isReadOnly && (
                        <button
                          onClick={() => handleCopyDetails(batch.id)}
                          className="flex items-center justify-center gap-1.5 bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
                          title="نسخ تفاصيل هذا الباتش إلى جميع الباتشات الأخرى"
                        >
                          <Copy className="w-4 h-4" />
                          نسخ للكل
                        </button>
                      )}
                      <button
                        onClick={() => printDocument(batch.id)}
                        className="flex items-center justify-center gap-1.5 bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm flex-1 md:flex-none"
                        title="طباعة أمر تشغيل لهذا الباتش"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة الباتش
                      </button>
                    </div>
                  </div>"""
content = content.replace(old_batch_header, new_batch_header)

# Replace the layout
old_main_div = """    <div className="space-y-6">"""
new_main_div = """    <div className="relative">
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>"""
content = content.replace(old_main_div, new_main_div)

old_render = """      <PrintEmbroideryWorkOrder order={{ ...order, batches }} />
    </div>
  );
};"""

new_render = """      </div>
      {printingBatchId && (
        <PrintEmbroideryWorkOrder order={order} batch={batches.find((b) => b.id === printingBatchId)!} />
      )}
    </div>
  );
};"""
content = content.replace(old_render, new_render)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)

print("Done")
