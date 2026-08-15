import re

with open('src/components/form/BomSection.tsx', 'r') as f:
    content = f.read()

# We want to add readOnly rendering logic before `return (` which is around line 119.
# Let's find `  return (\n    <div className="space-y-6">`
# and replace it.

replacement = """
  let totalOrderQty = 0;
  sizes.forEach(s => {
    s.variants.forEach(v => totalOrderQty += (v.quantity || 0));
  });

  const renderReadOnlyMaterials = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">جدول الخامات</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-bold border-b">نوع الخام</th>
              <th className="px-4 py-3 font-bold border-b">اسم الخام</th>
              <th className="px-4 py-3 font-bold border-b text-center">الوحدة</th>
              <th className="px-4 py-3 font-bold border-b text-center">سعر الوحدة</th>
              <th className="px-4 py-3 font-bold border-b text-center">الوزن المعياري / قطعة</th>
              <th className="px-4 py-3 font-bold border-b text-center">المطلوب</th>
              <th className="px-4 py-3 font-bold border-b text-center">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map(mat => {
              let totalReq = 0;
              let stdDisplay = "";
              if (mat.standardMethod === 'موحد') {
                totalReq = totalOrderQty * (mat.unifiedStandard || 0);
                stdDisplay = (mat.unifiedStandard || 0).toString();
              } else {
                stdDisplay = "حسب المقاس";
                sizes.forEach(s => {
                  let sizeQty = 0;
                  s.variants.forEach(v => sizeQty += (v.quantity || 0));
                  const sizeStd = mat.sizeStandards?.find(st => st.size === s.size)?.standard || 0;
                  totalReq += sizeQty * sizeStd;
                });
              }
              const totalPrice = totalReq * (mat.standardPrice || 0);
              
              return (
                <tr key={mat.id}>
                  <td className="px-4 py-3 text-slate-600">{mat.type || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{mat.name || '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{mat.unit || '—'}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{mat.standardPrice ? mat.standardPrice.toFixed(2) : '—'}</td>
                  <td className="px-4 py-3 text-center text-indigo-700">{stdDisplay}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">{totalReq.toFixed(3)}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{totalPrice > 0 ? totalPrice.toFixed(2) : '—'}</td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">لا توجد خامات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReadOnlyAccessories = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">جدول الإكسسوارات</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-bold border-b">الإكسسوار</th>
              <th className="px-4 py-3 font-bold border-b text-center">الوحدة</th>
              <th className="px-4 py-3 font-bold border-b text-center">المطلوب / قطعة</th>
              <th className="px-4 py-3 font-bold border-b text-center">المطلوب للأمر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accessories.map(acc => {
              let totalReq = 0;
              let stdDisplay = "";
              if (acc.standardMethod === 'موحد') {
                totalReq = totalOrderQty * (acc.unifiedStandard || 0);
                stdDisplay = (acc.unifiedStandard || 0).toString();
              } else {
                stdDisplay = "حسب المقاس";
                sizes.forEach(s => {
                  let sizeQty = 0;
                  s.variants.forEach(v => sizeQty += (v.quantity || 0));
                  const sizeStd = acc.sizeStandards?.find(st => st.size === s.size)?.standard || 0;
                  totalReq += sizeQty * sizeStd;
                });
              }
              
              return (
                <tr key={acc.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{acc.name || '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{acc.unit || '—'}</td>
                  <td className="px-4 py-3 text-center text-indigo-700">{stdDisplay}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">{totalReq.toFixed(3)}</td>
                </tr>
              );
            })}
            {accessories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">لا توجد إكسسوارات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (readOnly) {
    return (
      <div className="space-y-6">
        {renderReadOnlyMaterials()}
        {renderReadOnlyAccessories()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
"""

content = content.replace('  return (\n    <div className="space-y-6">', replacement)

with open('src/components/form/BomSection.tsx', 'w') as f:
    f.write(content)

print("Done")
