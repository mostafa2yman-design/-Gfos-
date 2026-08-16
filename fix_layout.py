import re
with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Add print:hidden to the header
content = content.replace('<header className="bg-white shadow-sm border-b border-slate-200">', '<header className="bg-white shadow-sm border-b border-slate-200 print:hidden">')
content = content.replace('<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">', '<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none">')

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
