import re

with open('src/components/workorders/BatchPreparationWorkOrder.tsx', 'r') as f:
    content = f.read()

# Replace return wrapper
old_wrapper = """  return (
    <div className="block p-8 bg-white" dir="rtl">
      {/* Header */}"""

new_wrapper = """  return (
    <div className="print-only hidden print:block text-black bg-white" dir="rtl">
      {/* Header */}"""
content = content.replace(old_wrapper, new_wrapper)

old_style = """      {/* Ensure printing properties */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 20mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>"""

new_style = """      {/* Ensure printing properties */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-family: 'Cairo', sans-serif; }
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </div>"""
content = content.replace(old_style, new_style)

with open('src/components/workorders/BatchPreparationWorkOrder.tsx', 'w') as f:
    f.write(content)

print("Done")
