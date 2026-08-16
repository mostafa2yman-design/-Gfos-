import re

with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

# Replace the messy start
mess = """  return (
    <div className="relative">
      <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
        <div
        className={`space-y-8 p-6 print:hidden ${printingBatchId ? "hidden" : ""}`}
      >
        <ConfirmDialog"""

good_start = """  return (
    <div className="relative">
      <div className={`space-y-8 p-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
        <ConfirmDialog"""

content = content.replace(mess, good_start)

# Now check the end.
mess_end = """              </div>
            );
          })}
        </div>
      {printingBatchId && (
        <BatchPreparationWorkOrder
          order={order}
          batch={order.batches.find((b) => b.id === printingBatchId)!}
        />
      )}
    </div>
  );
}"""

good_end = """              </div>
            );
          })}
      </div>
      {printingBatchId && (
        <div className="absolute top-0 left-0 w-full z-50 bg-white">
          <BatchPreparationWorkOrder
            order={order}
            batch={order.batches.find((b) => b.id === printingBatchId)!}
          />
        </div>
      )}
    </div>
  );
}"""
content = content.replace(mess_end, good_end)

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)

