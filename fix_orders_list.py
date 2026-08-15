import re

with open('src/components/ProductionOrdersList.tsx', 'r') as f:
    content = f.read()

replacement_thead = """              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">أمر الإنتاج</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">تاريخ الأمر</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">العميل</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الموديل</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الكمية المطلوبة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الكمية المقصوصة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الباتشات</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">إجراءات</th>
              </tr>"""

content = re.sub(r'<tr>\s*<th className="px-6 py-4 text-sm font-semibold text-slate-600">رقم الأمر</th>.*?</tr>', replacement_thead, content, flags=re.DOTALL)

# Now the tbody part
# The original row mapping:
#                   return (
#                     <tr key={order.id} className="hover:bg-slate-50 transition-colors">
#                       <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.orderNumber}</td>
#                       <td className="px-6 py-4 text-sm text-slate-600">{order.orderDate}</td>
#                       <td className="px-6 py-4 text-sm text-slate-900 font-medium">{order.styleName}</td>
#                       <td className="px-6 py-4 text-sm text-slate-600">
#                         <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
#                           {order.category}
#                         </span>
#                       </td>
#                       <td className="px-6 py-4 text-sm text-slate-600">{order.customerName}</td>
#                       <td className="px-6 py-4 text-sm font-bold text-indigo-600">{total}</td>
#                       <td className="px-6 py-4">...status badge...</td>
#                       <td className="px-6 py-4 text-center">...actions...</td>
#                     </tr>
#                   );

replacement_tbody = """                  let actualCutTotal = 0;
                  if (order.cutData && order.cutData.sizes) {
                    order.cutData.sizes.forEach(s => s.variants.forEach(v => actualCutTotal += (v.actualQuantity || 0)));
                  }
                  const batchesCount = order.batches ? order.batches.length : 0;
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.orderDate}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.customerName}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{order.styleName}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">{total}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{actualCutTotal > 0 ? actualCutTotal : '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{batchesCount > 0 ? batchesCount : '—'}</td>
                      <td className="px-6 py-4">
"""

content = re.sub(r'return\s*\(\s*<tr key=\{order.id\}.*?<td className="px-6 py-4">', replacement_tbody, content, flags=re.DOTALL)
content = content.replace("colSpan={8}", "colSpan={9}")

with open('src/components/ProductionOrdersList.tsx', 'w') as f:
    f.write(content)

print("Done")
