import re

with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

# I see in the output it still has `<PrintEmbroideryWorkOrder order={{ ...order, batches }} />`.
old_render = "      <PrintEmbroideryWorkOrder order={{ ...order, batches }} />"
new_render = """      </div>
      {printingBatchId && (
        <PrintEmbroideryWorkOrder order={order} batch={batches.find((b) => b.id === printingBatchId)!} />
      )}"""
content = content.replace(old_render, new_render)

# Remove the extra </div> and close properly
if "    </div>\n  );\n};\n" in content:
  pass
else:
  pass

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)

print("Done")
