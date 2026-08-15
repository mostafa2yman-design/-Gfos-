import re

with open('src/components/CutOrderForm.tsx', 'r') as f:
    content = f.read()

# Make sure we don't hide the print div
old_return = """  return (
    <div className="space-y-6">"""

new_return = """  return (
    <div className="relative">
      <div className="space-y-6 print:hidden">"""

old_end = """        </div>
      )}
            {isPrinting && (
        <div className="print:block hidden print:absolute print:inset-0">
          <CutWorkOrderPrint order={order} />
        </div>
      )}
    </div>
  );
}"""

new_end = """        </div>
      )}
      </div>
      {isPrinting && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50">
          <CutWorkOrderPrint order={order} />
        </div>
      )}
    </div>
  );
}"""

content = content.replace(old_return, new_return)
content = content.replace(old_end, new_end)

with open('src/components/CutOrderForm.tsx', 'w') as f:
    f.write(content)

print("Done")
