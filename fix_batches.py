import re

with open('src/components/BatchesForm.tsx', 'r') as f:
    content = f.read()

replacement = """      <div className="space-y-4">
        {batches.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-bold border-b">رقم الباتش</th>
                    <th className="px-4 py-3 font-bold border-b">المقاس</th>
                    <th className="px-4 py-3 font-bold border-b">اللون</th>
                    <th className="px-4 py-3 font-bold border-b text-center">المطلوب</th>
                    <th className="px-4 py-3 font-bold border-b text-center">حالة القص</th>
                    <th className="px-4 py-3 font-bold border-b text-center">حالة الطباعة</th>
                    <th className="px-4 py-3 font-bold border-b text-center">حالة الخياطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map(batch => {
                    const printStatus = batch.printEmbroideryStatus || 'لم يبدأ';
                    const sewStatus = batch.sewingData?.status || 'لم يبدأ';
                    const prepStatus = batch.prepStatus || 'لم يبدأ';
                    
                    return batch.sizes.map((size) => (
                      <React.Fragment key={`${batch.id}-${size.size}`}>
                        {size.variants.map((variant, vIdx) => (
                          <tr key={`${batch.id}-${size.size}-${variant.color}`}>
                            <td className="px-4 py-2 font-bold text-slate-800">{batch.batchNumber}</td>
                            <td className="px-4 py-2 text-slate-700">{size.size}</td>
                            <td className="px-4 py-2 text-slate-600">{variant.color}</td>
                            <td className="px-4 py-2 text-center font-bold text-indigo-600">{variant.quantity}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs">مكتمل</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                printStatus === 'مكتمل' ? 'bg-emerald-50 text-emerald-700' :
                                printStatus === 'جاري' ? 'bg-amber-50 text-amber-700' :
                                printStatus === 'تم التخطي' ? 'bg-slate-100 text-slate-600' :
                                'bg-slate-100 text-slate-500'
                              }`}>{printStatus}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                sewStatus === 'مكتمل' ? 'bg-emerald-50 text-emerald-700' :
                                sewStatus === 'جاري' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>{sewStatus}</span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">لم يتم إنشاء أي باتشات بعد</p>
            <p className="text-slate-400 text-sm mt-1">اختر طريقة التقسيم التلقائي للبدء</p>
          </div>
        )}
      </div>
"""

# The original has:
#       <div className="space-y-4">
#         {batches.map(batch => {
#           let batchTotal = 0;

# Let's use regex to replace `<div className="space-y-4">` until the end of the file except the last `</div>    </>  );}`
pattern = re.compile(r'<div className="space-y-4">.*?</div>\s*</div>\s*</>\s*\);\s*}', re.DOTALL)

new_content = pattern.sub(replacement + "    </div>\n    </>\n  );\n}", content)

with open('src/components/BatchesForm.tsx', 'w') as f:
    f.write(new_content)

print("Done")
