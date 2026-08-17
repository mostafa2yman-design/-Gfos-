import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

target = """                    <button
                      onClick={() => handlePrintBatch(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة أمر الطباعة
                    </button>
                  </div>"""

replacement = """                    <button
                      onClick={() => handlePrintBatch(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة أمر الطباعة
                    </button>
                    {!isReadOnly && batches.length > 1 && (
                      <button
                        onClick={() => handleCopyDetails(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                        title="نسخ تفاصيل الطباعة والتطريز للباتشات المتبقية"
                      >
                        <Copy className="w-4 h-4" />
                        نسخ للباتشات
                      </button>
                    )}
                  </div>"""

content = content.replace(target, replacement)
with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
