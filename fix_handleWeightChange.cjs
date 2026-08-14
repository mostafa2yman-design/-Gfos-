const fs = require('fs');
let code = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

const oldHandle = `  const handleWeightChange = (color: string, value: number) => {
    if (isReadOnly) return;
    setCutData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actualWeightByColor: {
          ...(prev.actualWeightByColor || {}),
          [color]: value
        }
      };
    });
  };`;

const newHandle = `  const handleWeightChange = (color: string, value: number) => {
    if (isReadOnly) return;
    setCutData(prev => {
      if (!prev) return prev;
      
      const newByColor = {
        ...(prev.actualWeightByColor || {}),
        [color]: value
      };
      
      const totalActualWeight = Object.values(newByColor).reduce((acc, curr) => acc + (curr || 0), 0);
      
      return {
        ...prev,
        actualWeightByColor: newByColor,
        actualWeight: totalActualWeight
      };
    });
  };`;

code = code.replace(oldHandle, newHandle);
fs.writeFileSync('src/components/CutOrderForm.tsx', code);
