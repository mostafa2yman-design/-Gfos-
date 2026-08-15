import re

with open('src/components/form/OrderBasicInfo.tsx', 'r') as f:
    content = f.read()

# Replace printEmbroideryStandardCost input
print_cost_regex = r"value=\{printEmbroideryStandardCost \|\| ''\}\n\s+disabled=\{readOnly\}\n\s+onChange=\{\(e\) => onChange\('printEmbroideryStandardCost', e\.target\.value\)\}\n\s+placeholder=\"0\.00\"\n\s+className=\{`([^`]+)`\}"

print_replacement = """value={printEmbroideryStandardCost ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('printEmbroideryStandardCost', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}"""

content = re.sub(print_cost_regex, print_replacement, content)

# Replace standardSewingCostPerPiece input
sewing_cost_regex = r"value=\{standardSewingCostPerPiece \|\| ''\}\n\s+disabled=\{readOnly\}\n\s+onChange=\{\(e\) => onChange\('standardSewingCostPerPiece', e\.target\.value\)\}\n\s+placeholder=\"0\.00\"\n\s+className=\{`([^`]+)`\}"

sewing_replacement = """value={standardSewingCostPerPiece ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('standardSewingCostPerPiece', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg transition-shadow text-lg font-bold ${
                  readOnly 
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner'
                }`}"""

content = re.sub(sewing_cost_regex, sewing_replacement, content)

# Make the labels bolder or clearer too
content = content.replace("تكلفة الطباعة/التطريز المعيارية للقطعة\n            </label>", "تكلفة الطباعة/التطريز المعيارية للقطعة\n            </label>")
content = content.replace("تكلفة الخياطة المعيارية للقطعة\n            </label>", "تكلفة الخياطة المعيارية للقطعة\n            </label>")

with open('src/components/form/OrderBasicInfo.tsx', 'w') as f:
    f.write(content)

