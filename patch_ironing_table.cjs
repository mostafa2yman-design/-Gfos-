const fs = require('fs');
let content = fs.readFileSync('src/components/IroningForm.tsx', 'utf8');

const replacement = `                  <div>
                    <h5 className="font-bold text-slate-700 mb-3 text-md">الكميات الفعلية المصنعة السليمة:</h5>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-bold border-b">المقاس</th>
                          <th className="px-4 py-3 font-bold border-b">اللون</th>
                          <th className="px-4 py-3 font-bold border-b">الوارد من التشطيب</th>
                          <th className="px-4 py-3 font-bold border-b">السليم (المكواة)</th>
                          <th className="px-4 py-3 font-bold border-b">النقص (الهالك)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                           let finishingTotal = 0;
                           let ironingTotal = 0;
                           let missingTotal = 0;
                           
                           const rows = batch.finishingData?.actualQuantities?.map(sq => {
                                 const incomingQty = (sq as any).actualQuantity ?? (sq as any).quantity ?? 0;
                                 const currentIroningQty = (fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color) as any)?.actualQuantity ?? (fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color) as any)?.quantity ?? incomingQty;
                                 const diff = incomingQty - currentIroningQty;
                                 
                                 finishingTotal += incomingQty;
                                 ironingTotal += currentIroningQty;
                                 missingTotal += diff;
                                 
                                 return (
                                    <tr key={\`\${sq.size}-\${sq.color}\`}>
                                       <td className="px-4 py-3 text-slate-600 font-medium">
                                          {sq.size}
                                       </td>
                                       <td className="px-4 py-3 text-slate-600 font-medium">
                                          {sq.color}
                                       </td>
                                       <td className="px-4 py-3 text-slate-600">
                                          {incomingQty}
                                       </td>
                                       <td className="px-4 py-3 w-48">
                                          <input 
                                             type="number"
                                             min="0"
                                             max={incomingQty}
                                             disabled={isBatchReadOnly}
                                             value={currentIroningQty === 0 && !(fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color)) ? "" : currentIroningQty}
                                             onChange={(e) => {
                                                let val = parseInt(e.target.value, 10);
                                                if (isNaN(val)) val = 0;
                                                if (val > incomingQty) val = incomingQty;
                                                handleVariantQuantityChange(batch.id, sq.size, sq.color, val);
                                             }}
                                             className="w-full px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                                             placeholder="0"
                                          />
                                       </td>
                                       <td className="px-4 py-3">
                                          {diff > 0 && (
                                            <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full text-xs">
                                              {diff}
                                            </span>
                                          )}
                                          {diff === 0 && currentIroningQty > 0 && (
                                            <Check className="w-4 h-4 text-emerald-500 inline" />
                                          )}
                                       </td>
                                    </tr>
                                 );
                           });
                           
                           return (
                             <>
                               {rows}
                               <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                 <td colSpan={2} className="px-4 py-3 text-slate-800 text-left">الإجمالي</td>
                                 <td className="px-4 py-3 text-slate-800">{finishingTotal}</td>
                                 <td className="px-4 py-3 text-indigo-700">{ironingTotal}</td>
                                 <td className="px-4 py-3 text-amber-600">{missingTotal}</td>
                               </tr>
                             </>
                           );
                        })()}
                      </tbody>
                    </table>
                    </div>
                  </div>`;

content = content.replace(/<div>\s*<h5 className="font-medium text-slate-700 mb-2 text-sm">تأكيد أعداد المكواة الفعلية السليمة:<\/h5>[\s\S]*?<\/table>\s*<\/div>\s*<\/div>/, replacement);

fs.writeFileSync('src/components/IroningForm.tsx', content);
