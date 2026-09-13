const fs = require('fs');
let content = fs.readFileSync('src/components/PrintPrepSheet.tsx', 'utf8');

// I'll search for the injected block and clean up whatever is after it up to `const handleToggleAllAccessories`
const regex = /const handleUpdateActualAccessory = async \([\s\S]*?\}\s*;\s*\}\s*return b;\s*\}\);\s*const result = await Cmd\.savePrepData\(order, updatedBatches\);\s*if \(result\.success && result\.data\) \{\s*setOrder\(result\.data\);\s*\}\s*\};/;

// Actually, let's just do string replacement if we know exactly what is wrong.
// The output of `sed -n '120,150p'` was:
/*
  const handleUpdateActualAccessory = async (batchId: string, accessoryName: string, actualName: string) => {
    // Optimistic update
    ...
  };
      }
      return b;
    });
    const result = await Cmd.savePrepData(order, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
*/
// It seems there are trailing characters from the old function.

content = content.replace(
  /const handleUpdateActualAccessory = async \([\s\S]*?\}\s*;\s*\n\s*\}\s*\n\s*return b;\s*\n\s*\}\);\s*\n\s*const result = await Cmd\.savePrepData\(order, updatedBatches\);\s*\n\s*if \(result\.success && result\.data\) \{\s*\n\s*setOrder\(result\.data\);\s*\n\s*\}\s*\n\s*\};/,
  `const handleUpdateActualAccessory = async (batchId: string, accessoryName: string, actualName: string) => {
    const updatedBatches = order!.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep?.map((a) =>
            a.accessoryName === accessoryName
              ? { ...a, actualAccessoryName: actualName }
              : a,
          ) || [],
        };
      }
      return b;
    });
    
    setOrder({ ...order!, batches: updatedBatches });
    
    const result = await Cmd.savePrepData(order!, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };`
);

fs.writeFileSync('src/components/PrintPrepSheet.tsx', content);
