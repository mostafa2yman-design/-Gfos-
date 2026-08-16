import re
with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

old_btn = """                    <button
                      onClick={() => handlePrint(batch.id)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                      title="طباعة أمر التجهيز"
                    >
                      <Printer className="w-5 h-5" />
                    </button>"""

new_btn = """                    <button
                      onClick={() => handlePrint(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة
                    </button>"""

content = content.replace(old_btn, new_btn)

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)
