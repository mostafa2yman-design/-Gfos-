sed -i 's/import { getOrderById, saveOrder } from "..\/lib\/storage";/import { getOrderById } from "..\/lib\/storage";\nimport * as Cmd from "..\/lib\/productionOrderCommands";/g' src/components/CutOrderForm.tsx

sed -i 's/const updatedOrder: ProductionOrder = {/const result = Cmd.saveCutData(order, cutData);\n    if (result.success) {\n      onSaved();\n    } else {\n      alert(result.error);\n    }\n    return;\n    const _ignore: any = {/g' src/components/CutOrderForm.tsx

sed -i 's/const updatedOrder: ProductionOrder = {/const result = Cmd.approveCutOrder(order, cutData);\n      if (result.success) {\n        onSaved();\n      } else {\n        alert(result.error);\n      }\n      return;\n      const _ignore2: any = {/g' src/components/CutOrderForm.tsx
