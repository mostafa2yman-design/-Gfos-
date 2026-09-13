const fs = require('fs');
let content = fs.readFileSync('src/components/form/OrderBasicInfo.tsx', 'utf8');

if (!content.includes('sellingPrice?: number;')) {
    content = content.replace(/standardIroningCostPerPiece\?: number;/, 'standardIroningCostPerPiece?: number;\n  sellingPrice?: number;');
    content = content.replace(/standardIroningCostPerPiece,/, 'standardIroningCostPerPiece,\n  sellingPrice,');
    
    const replacement = `            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 whitespace-nowrap">
              سعر البيع المقترح / قطعة <span className="text-slate-400 font-normal">(اختياري)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={readOnly}
                value={sellingPrice ?? ''}
                onChange={(e) => onChange('sellingPrice', e.target.value)}
                className="w-full px-4 py-2.5 pl-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="مثال: 300"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                ج.م
              </span>
            </div>
          </div>
        </div>
      </div>`;
    
    // Find the end of the costs row (after Ironing cost)
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="space-y-6">/, replacement + '\n      <div className="space-y-6">');
    fs.writeFileSync('src/components/form/OrderBasicInfo.tsx', content);
}
