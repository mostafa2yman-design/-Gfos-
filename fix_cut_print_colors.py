import re
with open('src/components/print/CutWorkOrderPrint.tsx', 'r') as f:
    content = f.read()

old_table = """              {Object.entries(order.cutData.actualWeightByColor).map(([color, weight]) => {
                const reqFabric = fabricSummary?.colors?.find((c: any) => c.color === color)?.requiredFabric;
                return (
                  <tr key={color}>
                    <td className="font-medium">{color}</td>
                    <td className="text-center">{reqFabric ? reqFabric.toFixed(3) : '—'}</td>
                    <td className="text-center">{weight}</td>
                  </tr>
                );
              })}"""

new_table = """              {(fabricSummary?.colors || []).map((c: any) => {
                const weight = order.cutData?.actualWeightByColor?.[c.color];
                return (
                  <tr key={c.color}>
                    <td className="font-medium">{c.color}</td>
                    <td className="text-center">{c.requiredFabric ? c.requiredFabric.toFixed(3) : '—'}</td>
                    <td className="text-center text-lg">{weight !== undefined ? weight : ''}</td>
                  </tr>
                );
              })}"""

content = content.replace(old_table, new_table)

old_condition = """      {order.cutData?.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0 && ("""
new_condition = """      {fabricSummary && fabricSummary.colors.length > 0 && ("""

content = content.replace(old_condition, new_condition)

with open('src/components/print/CutWorkOrderPrint.tsx', 'w') as f:
    f.write(content)
