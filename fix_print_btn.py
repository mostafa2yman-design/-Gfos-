import re
with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

select_end = """                      <option value="طباعة + تطريز">طباعة + تطريز</option>
                    </select>
                  </div>"""

button_html = """                      <option value="طباعة + تطريز">طباعة + تطريز</option>
                    </select>
                    <button
                      onClick={() => handlePrintBatch(batch.id)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors border border-slate-200"
                      title="طباعة أمر الطباعة / التطريز"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>"""

content = content.replace(select_end, button_html)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)
