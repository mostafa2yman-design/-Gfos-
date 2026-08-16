import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

# Add handlePrintBatch function
print_batch_func = """  const handlePrintBatch = (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };
"""

content = content.replace('  const handleSaveDraft = () => {', print_batch_func + '\n  const handleSaveDraft = () => {')

# Add print button to each batch header
ui_pattern = r'(                    <select\n                      value=\{batch.executionType \|\| ""\}\n                      onChange=\{\(e\) =>\n                        handleExecutionTypeChange\(\n                          batch.id,\n                          e.target.value as PrintEmbroideryExecutionType,\n                        \)\n                      \}\n                      disabled=\{isReadOnly\}\n                      className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"\n                    >\n                      <option value="">-- اختر --</option>\n                      <option value="طباعة">طباعة</option>\n                      <option value="تطريز">تطريز</option>\n                      <option value="طباعة \+ تطريز">طباعة \+ تطريز</option>\n                      <option value="بدون طباعة / تطريز">بدون طباعة / تطريز</option>\n                    </select>\n                  </div>)'

ui_replacement = """                    <select
                      value={batch.executionType || ""}
                      onChange={(e) =>
                        handleExecutionTypeChange(
                          batch.id,
                          e.target.value as PrintEmbroideryExecutionType,
                        )
                      }
                      disabled={isReadOnly}
                      className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- اختر --</option>
                      <option value="طباعة">طباعة</option>
                      <option value="تطريز">تطريز</option>
                      <option value="طباعة + تطريز">طباعة + تطريز</option>
                      <option value="بدون طباعة / تطريز">بدون طباعة / تطريز</option>
                    </select>
                    
                    <button
                      onClick={() => handlePrintBatch(batch.id)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors border border-slate-200"
                      title="طباعة أمر الطباعة / التطريز"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>"""

content = re.sub(ui_pattern, ui_replacement, content)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
