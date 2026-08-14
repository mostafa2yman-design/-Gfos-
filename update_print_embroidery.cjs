const fs = require('fs');

let code = fs.readFileSync('src/components/PrintEmbroideryForm.tsx', 'utf8');

const handleCostChange = `
  const handleCostChange = (batchId: string, field: 'standardCost' | 'actualCost', value: number) => {
    setBatches(batches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          printEmbroideryCost: {
            ...b.printEmbroideryCost,
            standardCost: b.printEmbroideryCost?.standardCost || 0,
            [field]: value
          }
        };
      }
      return b;
    }));
  };
`;

code = code.replace(
  `const handlePrintChange =`,
  handleCostChange + `\n  const handlePrintChange =`
);

const costSection = `
                  {batch.executionType && batch.executionType !== 'بدون طباعة / تطريز' && (
                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 mt-4">
                      <h5 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        تكلفة الطباعة / التطريز
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة المعيارية للقطعة <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={batch.printEmbroideryCost?.standardCost || ''}
                              onChange={(e) => handleCostChange(batch.id, 'standardCost', parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                              placeholder="0.00"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">جنيه</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة الفعلية للقطعة</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={batch.printEmbroideryCost?.actualCost || ''}
                              onChange={(e) => handleCostChange(batch.id, 'actualCost', parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                              placeholder="0.00 (تترك فارغة إذا لم تكتمل)"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">جنيه</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
`;

code = code.replace(
  `{/* Print Details */}`,
  costSection + `\n                  {/* Print Details */}`
);

fs.writeFileSync('src/components/PrintEmbroideryForm.tsx', code);
