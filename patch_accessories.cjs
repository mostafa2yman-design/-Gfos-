const fs = require('fs');
let content = fs.readFileSync('src/components/PrintPrepSheet.tsx', 'utf8');

// The issue might be that we need a more robust way to handle state updates for accessories
// Let's modify the onChange handler to use a local state or direct DOM update to bypass latency,
// or just fix the handleUpdateActualAccessory function if there's a reference issue.

content = content.replace(
  /const handleUpdateActualAccessory = async \(batchId: string, accessoryName: string, actualName: string\) => {[\s\S]*?};/,
  `const handleUpdateActualAccessory = async (batchId: string, accessoryName: string, actualName: string) => {
    // Optimistic update
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
    
    // Immediately set local state for responsive UI
    setOrder({ ...order!, batches: updatedBatches });
    
    // Persist to storage
    const result = await Cmd.savePrepData(order!, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };`
);

fs.writeFileSync('src/components/PrintPrepSheet.tsx', content);
