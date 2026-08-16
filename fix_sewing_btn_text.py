import re
with open('src/components/SewingForm.tsx', 'r') as f:
    content = f.read()

old_btn = """                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  باتش: {batch.batchNumber}
                  <button onClick={() => handlePrint(batch.id)} className="text-slate-500 hover:text-indigo-600 transition-colors p-1" title="طباعة إيصال استلام وتسلّم">
                    <Printer className="w-5 h-5" />
                  </button>
                </h3>"""

new_btn = """                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-4">
                  باتش: {batch.batchNumber}
                  <button 
                    onClick={() => handlePrint(batch.id)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة الإيصال
                  </button>
                </h3>"""

content = content.replace(old_btn, new_btn)

with open('src/components/SewingForm.tsx', 'w') as f:
    f.write(content)
