import re
with open('src/components/print/CutWorkOrderPrint.tsx', 'r') as f:
    content = f.read()

content = content.replace('interface Props {\n  order: ProductionOrder;\n}', 'interface Props {\n  order: ProductionOrder;\n  fabricSummary?: any;\n}')

content = content.replace('export const CutWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {', 'export const CutWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order, fabricSummary }, ref) => {')

old_table = """      {order.cutData?.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0 && (
        <PrintSection title="بيان المسحوب الفعلي من الأقمشة حسب اللون" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>اللون</th>
                <th className="text-center">المسحوب الفعلي ({order.fabricWeightUnit})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(order.cutData.actualWeightByColor).map(([color, weight]) => (
                <tr key={color}>
                  <td className="font-medium">{color}</td>
                  <td className="text-center">{weight}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td>إجمالي المسحوب الفعلي:</td>
                <td className="text-center text-indigo-700">{order.cutData.actualWeight || 0}</td>
              </tr>
            </tbody>
          </table>
        </PrintSection>
      )}"""

new_table = """      {order.cutData?.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0 && (
        <PrintSection title="بيان مسحوبات الأقمشة من المخزن حسب اللون" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>اللون</th>
                <th className="text-center">المطلوب المعياري ({order.fabricWeightUnit})</th>
                <th className="text-center">المسحوب الفعلي ({order.fabricWeightUnit})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(order.cutData.actualWeightByColor).map(([color, weight]) => {
                const reqFabric = fabricSummary?.colors?.find((c: any) => c.color === color)?.requiredFabric;
                return (
                  <tr key={color}>
                    <td className="font-medium">{color}</td>
                    <td className="text-center">{reqFabric ? reqFabric.toFixed(3) : '—'}</td>
                    <td className="text-center">{weight}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-bold">
                <td>الإجمالي:</td>
                <td className="text-center text-indigo-700">{fabricSummary?.totalRequiredFabric ? fabricSummary.totalRequiredFabric.toFixed(3) : '—'}</td>
                <td className="text-center text-indigo-700">{order.cutData.actualWeight || 0}</td>
              </tr>
            </tbody>
          </table>
        </PrintSection>
      )}"""

content = content.replace(old_table, new_table)

with open('src/components/print/CutWorkOrderPrint.tsx', 'w') as f:
    f.write(content)
