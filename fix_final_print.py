import re

with open('src/components/PrintEmbroideryForm.tsx', 'r') as f:
    content = f.read()

# Let's clean up the whole render method:
old_render_start = """  return (
    <div className="relative">
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}

      </div>
      {printingBatchId && (
        <PrintEmbroideryWorkOrder order={order} batch={batches.find((b) => b.id === printingBatchId)!} />
      )}

      <div className="space-y-6 p-6 print:hidden">"""

new_render_start = """  return (
    <div className="relative">
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}
"""

content = content.replace(old_render_start, new_render_start)

# Now I need to inject PrintEmbroideryWorkOrder at the end of the file.
old_render_end = """        </div>
      </div>
    </div>
  );
};"""

new_render_end = """        </div>
      </div>
      </div>
      {printingBatchId && (
        <PrintEmbroideryWorkOrder order={order} batch={batches.find((b) => b.id === printingBatchId)!} />
      )}
    </div>
  );
};"""

content = content.replace(old_render_end, new_render_end)

with open('src/components/PrintEmbroideryForm.tsx', 'w') as f:
    f.write(content)

print("Done")
