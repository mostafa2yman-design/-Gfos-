import re

with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

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

better_end = """              </div>
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

# Actually, I'm missing one </div> before {printingBatchId

new_end = """              </div>
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

# I need to add one more </div>
content = content.replace(good_end, good_end.replace('      </div>\n      {printingBatchId', '      </div>\n      </div>\n      {printingBatchId'))

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.write(content)
