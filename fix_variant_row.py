import re

with open('src/components/form/VariantRow.tsx', 'r') as f:
    content = f.read()

replacement = """        <input
          list={`colors-list`}
          value={variant.color}
          disabled={readOnly}
          onChange={(e) => onChange('color', e.target.value)}
          placeholder="اختر أو اكتب لوناً..."
          className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium ${
            readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'
          }`}
        />
        <datalist id="colors-list">
          {availableColors.map(color => (
            <option key={color} value={color} />
          ))}
        </datalist>"""

content = re.sub(r'<select\n.*?value=\{variant\.color\}\n.*?</select>', replacement, content, flags=re.DOTALL)

with open('src/components/form/VariantRow.tsx', 'w') as f:
    f.write(content)

print("Done")
