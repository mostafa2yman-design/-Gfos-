with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    lines = f.readlines()

toggle_all_func = """  const handleToggleAllAccessories = (batchId: string, isPrepared: boolean) => {
    const updatedBatches = order!.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map((a) => ({
            ...a,
            isPrepared
          })),
        };
      }
      return b;
    });

    const result = Cmd.savePrepData(order!, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };
"""

lines.insert(109, toggle_all_func)

with open('src/components/PrintPrepSheet.tsx', 'w') as f:
    f.writelines(lines)
