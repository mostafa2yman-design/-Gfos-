const fs = require('fs');
let code = fs.readFileSync('src/components/PrintPrepSheet.tsx', 'utf8');

code = code.replace(
  `import { Printer, Check, CheckSquare, Square } from 'lucide-react';`,
  `import { Printer, Check, CheckSquare, Square } from 'lucide-react';
import { calculateBatchAccessories } from '../lib/prepUtils';
import { BatchPreparationWorkOrder } from './BatchPreparationWorkOrder';`
);

const stateInjection = `const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);

  const handlePrint = (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };`;

code = code.replace(
  `const [success, setSuccess] = useState<string | null>(null);`,
  `const [success, setSuccess] = useState<string | null>(null);
  ${stateInjection}`
);

// Replace button handlePrint
code = code.replace(
  `onClick={() => handlePrint(batch.id)}`,
  `onClick={() => handlePrint(batch.id)}`
); // already uses handlePrint! Let's check if handlePrint was already defined. Wait, it was not defined in the original file I cat'ed! Ah, the original code had `onClick={() => handlePrint(batch.id)}` but it wasn't defined. Or maybe it was `window.print()`?
