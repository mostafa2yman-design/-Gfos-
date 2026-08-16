import re
with open('src/components/print/CutWorkOrderPrint.tsx', 'r') as f:
    content = f.read()

old_tbody = """          <tbody>
            {order.sizes.map((size) =>
              size.variants.map((v) => {
                const actual = order.cutData?.sizes
                  .find(s => s.size === size.size)
                  ?.variants.find(av => av.color === v.color)?.actualQuantity;
                return (
                  <tr key={`${size.size}-${v.color}`}>
                    <td>{size.size}</td>
                    <td>{v.color}</td>
                    <td className="text-center font-bold">{v.quantity}</td>
                    <td className="text-center">{actual !== undefined ? actual : ''}</td>
                  </tr>
                );
              })
            )}
          </tbody>"""

new_tbody = """          <tbody>
            {order.sizes.map((size) => (
              <React.Fragment key={size.size}>
                {size.variants.map((v, i) => {
                  const actual = order.cutData?.sizes
                    .find(s => s.size === size.size)
                    ?.variants.find(av => av.color === v.color)?.actualQuantity;
                  return (
                    <tr key={`${size.size}-${v.color}`}>
                      {i === 0 && <td className="font-bold align-middle" rowSpan={size.variants.length}>{size.size}</td>}
                      <td>{v.color}</td>
                      <td className="text-center font-bold">{v.quantity}</td>
                      <td className="text-center text-lg">{actual !== undefined ? actual : ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>"""

content = content.replace(old_tbody, new_tbody)

with open('src/components/print/CutWorkOrderPrint.tsx', 'w') as f:
    f.write(content)
