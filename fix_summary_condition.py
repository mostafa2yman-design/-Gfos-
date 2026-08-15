import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

replacement = """<OrderSummary sizes={order.sizes} actualSizes={(['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'مغلق'].includes(order.status) && order.cutData?.sizes) ? order.cutData.sizes : undefined} />"""

content = re.sub(r'<OrderSummary sizes=\{order\.sizes\} actualSizes=\{[^\}]+\} />', replacement, content)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)

print("Done")
