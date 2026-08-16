const fs = require('fs');
let code = fs.readFileSync('src/components/PrintPrepSheet.tsx', 'utf8');

// The error is because the tags are messed up at the end.
// Let's strip the end and re-write it correctly.
// we want to wrap the first part in <div className="space-y-6 print:hidden">

// find return (
const returnIndex = code.indexOf('return (');
const body = code.substring(returnIndex);

// Let's just rewrite the return statement. We know the structure.
// I'll extract everything inside the first <> up to just before {printingBatchId && (
const match = body.match(/return \([\s\S]*?(<ConfirmDialog[\s\S]*?){\s*printingBatchId/);

if (match) {
    const mainContent = match[1];
    
    // remove the last </div>\n      </div> that might be trailing
    let cleanedContent = mainContent.replace(/<\/div>\s*<\/div>\s*$/, '');
    // actually, let's just find where `        </div>\n      </div>\n` is
    const parts = body.split('{printingBatchId && (');
    if (parts.length === 2) {
        let topPart = parts[0];
        let bottomPart = '{printingBatchId && (' + parts[1];
        
        // topPart should be:
        // return (
        //   <div className="relative">
        //     <div className={`space-y-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
        //       <ConfirmDialog ...
        //       ...
        //     </div>
        //     <BatchPreparationWorkOrder ... />
        //   </div>
        // )
        
        // Let's clean topPart
        topPart = topPart.replace(/return \(\s*(?:<>)?\s*(?:<div className="relative">\s*)?(?:<div className={`space-y-6 print:hidden \${printingBatchId \? "hidden" : ""}`}>\s*)?(?:<div className="space-y-6">\s*)?/, '');
        
        // now topPart starts with {confirmConfig
        // let's remove trailing </div>s from topPart
        topPart = topPart.replace(/<\/div>\s*<\/div>\s*$/, '');
        topPart = topPart.replace(/<\/div>\s*$/, '');
        // let's remove trailing </div> again just in case
        topPart = topPart.replace(/<\/div>\s*$/, '');
        
        const newReturn = `
  return (
    <div className="relative">
      <div className={\`space-y-6 print:hidden \${printingBatchId ? "hidden" : ""}\`}>
        ${topPart}
      </div>
      {printingBatchId && (
        <BatchPreparationWorkOrder
          order={order}
          batch={order.batches.find((b) => b.id === printingBatchId)!}
        />
      )}
    </div>
  );
}
`;
        fs.writeFileSync('src/components/PrintPrepSheet.tsx', code.substring(0, returnIndex) + newReturn);
        console.log("Fixed!");
    }
}
