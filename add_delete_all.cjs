const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');

if (!code.includes('deleteAllOrders')) {
  code += `\n\nexport const deleteAllOrders = (): boolean => {
  try {
    return saveOrders([]);
  } catch (error) {
    console.error('Failed to delete all orders:', error);
    return false;
  }
};\n`;
  fs.writeFileSync('src/lib/storage.ts', code);
}
