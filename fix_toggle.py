import re
with open('src/components/PrintPrepSheet.tsx', 'r') as f:
    content = f.read()

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

    setOrder({ ...order!, batches: updatedBatches });
  };"""

if "handleToggleAllAccessories" not in content[:content.find("handleToggleAllAccessories") + 1]:
    # Need to insert it
    # find handleToggleAccessory
    pattern = r'(  const handleToggleAccessory = [^\n]+\n.*?setOrder\(\{ \.\.\.order, batches: updatedBatches \}\);\n  \};)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        content = content.replace(match.group(1), match.group(1) + '\n\n' + toggle_all_func)
    
    with open('src/components/PrintPrepSheet.tsx', 'w') as f:
        f.write(content)
