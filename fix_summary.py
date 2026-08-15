import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

replacement = """          <OrderBasicInfo
            orderNumber={order.orderNumber}
            orderDate={order.orderDate}
            styleName={order.styleName}
            category={order.category}
            customerName={order.customerName}
            printEmbroideryStandardCost={order.printEmbroideryStandardCost}
            standardSewingCostPerPiece={order.standardSewingCostPerPiece}
            onChange={handleBasicInfoChange}
            readOnly={isReadOnly}
          />"""

content = re.sub(r'<OrderBasicInfo\s*orderNumber=\{order\.orderNumber\}\s*orderDate=\{order\.orderDate\}\s*styleName=\{order\.styleName\}\s*category=\{order\.category\}\s*customerName=\{order\.customerName\}\s*onChange=\{handleBasicInfoChange\}\s*readOnly=\{isReadOnly\}\s*/>', replacement, content)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)

with open('src/components/form/OrderSummary.tsx', 'r') as f:
    content2 = f.read()

# Fix actualSizes loop
# from:
#       size.variants.forEach(variant => {
#         if (variant.color && variant.quantity) {
#           const qty = Number(variant.quantity) || 0;
# to:
#       size.variants.forEach((variant: any) => {
#         const actualQty = variant.actualQuantity !== undefined ? variant.actualQuantity : variant.quantity;
#         if (variant.color && actualQty !== undefined) {
#           const qty = Number(actualQty) || 0;

old_actual = """  if (actualSizes) {
    actualSizes.forEach(size => {
      let currentSizeTotal = 0;
      size.variants.forEach(variant => {
        if (variant.color && variant.quantity) {
          const qty = Number(variant.quantity) || 0;
          actualColorTotals[variant.color] = (actualColorTotals[variant.color] || 0) + qty;
          currentSizeTotal += qty;
          actualGrandTotal += qty;
        }
      });
      actualSizeTotals[size.size] = currentSizeTotal;
    });
  }"""

new_actual = """  if (actualSizes) {
    actualSizes.forEach(size => {
      let currentSizeTotal = 0;
      size.variants.forEach((variant: any) => {
        const actualQty = variant.actualQuantity !== undefined ? variant.actualQuantity : variant.quantity;
        if (variant.color && actualQty !== undefined) {
          const qty = Number(actualQty) || 0;
          actualColorTotals[variant.color] = (actualColorTotals[variant.color] || 0) + qty;
          currentSizeTotal += qty;
          actualGrandTotal += qty;
        }
      });
      actualSizeTotals[size.size] = currentSizeTotal;
    });
  }"""

content2 = content2.replace(old_actual, new_actual)

with open('src/components/form/OrderSummary.tsx', 'w') as f:
    f.write(content2)

print("Done")
