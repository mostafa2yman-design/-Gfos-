const fs = require('fs');
const content = fs.readFileSync('src/components/PrintPrepSheet.tsx', 'utf8');

// replace everything after the last `          })}`
const match = content.match(/          \}\)\}\n[\s\S]*$/);
if (match) {
    const end = match[0];
    const newEnd = `          })}
        </div>
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
}`;
    fs.writeFileSync('src/components/PrintPrepSheet.tsx', content.replace(end, newEnd));
    console.log("Done");
}
