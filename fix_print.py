import re

with open('src/components/CutOrderForm.tsx', 'r') as f:
    content = f.read()

# Remove useReactToPrint import
content = re.sub(r'import\s+{\s*useReactToPrint\s*}\s*from\s*"react-to-print";\n', '', content)

# Remove printRef and reactToPrintFn, and add isPrinting state + handlePrint
replacement_state = """  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };"""

content = re.sub(r'\s*const printRef = useRef<HTMLDivElement>\(null\);\s*const reactToPrintFn = useReactToPrint\({ contentRef: printRef }\);', '\n' + replacement_state, content)

# Replace reactToPrintFn() calls
content = content.replace("reactToPrintFn()", "handlePrint()")

# Wrap main div with print hiding
content = content.replace('<div className="space-y-6 p-6">', '<div className={`space-y-6 p-6 print:hidden ${isPrinting ? "hidden" : ""}`}>')

# Fix the end wrapper
end_replacement = """      {isPrinting && (
        <div className="print:block hidden print:absolute print:inset-0">
          <CutWorkOrderPrint order={order} />
        </div>
      )}"""
content = re.sub(r'<div className="hidden">\s*<CutWorkOrderPrint ref=\{printRef\} order=\{order\} />\s*</div>', end_replacement, content)

with open('src/components/CutOrderForm.tsx', 'w') as f:
    f.write(content)

print("Done CutOrderForm")
