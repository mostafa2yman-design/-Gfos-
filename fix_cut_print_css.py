import re

with open('src/components/print/CutWorkOrderPrint.tsx', 'r') as f:
    content = f.read()

# Replace return wrapper
old_wrapper = """  return (
    <div ref={ref} className="p-8 bg-white text-black w-full" dir="rtl" style={{ minHeight: '297mm' }}>
      {/* Header */}"""

new_wrapper = """  return (
    <div ref={ref} className="print-only hidden print:block text-black bg-white" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-family: 'Cairo', sans-serif; }
          @page { size: A4; margin: 15mm; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
      `}} />
      {/* Header */}"""
content = content.replace(old_wrapper, new_wrapper)

with open('src/components/print/CutWorkOrderPrint.tsx', 'w') as f:
    f.write(content)

print("Done")
