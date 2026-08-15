import re

with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

# I will find the end of the component
if "      {printingBatchId && (" not in content:
    # It means I didn't add the printing logic properly at the end
    end_pattern = r"        </div>\n      </div>\n    </div>\n  );\n};\n$"
    replacement = """        </div>
      </div>
      </div>
      {printingBatchId && (
        <PrintEmbroideryWorkOrder order={order} batch={batches.find((b) => b.id === printingBatchId)!} />
      )}
    </div>
  );
};
"""
    content = re.sub(end_pattern, replacement, content)
else:
    # I already added it, but maybe div tags are wrong
    # Let's count divs manually or just replace the end with proper divs
    pass

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)

print("Done")
