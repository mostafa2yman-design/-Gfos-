import re

with open('src/components/ProductionOrderForm.tsx', 'r') as f:
    content = f.read()

# Add getOrders to imports
content = content.replace("import { generateOrderNumber, getOrderById } from \"../lib/storage\";", "import { generateOrderNumber, getOrderById, getOrders } from \"../lib/storage\";")

# Add creation mode state
state_target = "  const [isCopyOrderOpen, setIsCopyOrderOpen] = useState(false);"
state_replacement = """  const [creationMode, setCreationMode] = useState<'new'|'copy'>('new');
  const [sourceOrderId, setSourceOrderId] = useState('');
  const [previousOrders, setPreviousOrders] = useState<ProductionOrder[]>([]);

  useEffect(() => {
    if (!orderId) {
      const orders = getOrders();
      orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setPreviousOrders(orders);
    }
  }, [orderId]);
"""
content = content.replace(state_target, state_replacement)

# Remove CopyOrderModal import and usage
content = re.sub(r'import { CopyOrderModal } from "\./CopyOrderModal";\n?', '', content)
content = re.sub(r'<CopyOrderModal[\s\S]*?/>', '', content)

# Remove the copy order button in header
button_target = """        <div className="flex gap-3">
          {!orderId && !isReadOnly && (
            <button
              type="button"
              onClick={() => setIsCopyOrderOpen(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm font-medium"
            >
              <Copy className="w-4 h-4" />
              استيراد من أمر سابق
            </button>
          )}"""
button_replacement = """        <div className="flex gap-3">"""
content = content.replace(button_target, button_replacement)

# Add the UI for creation mode right below the header
header_target = """      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isReadOnly
                ? `عرض أمر الإنتاج (${order.orderNumber})`
                : orderId
                  ? "تعديل أمر الإنتاج"
                  : "إنشاء أمر إنتاج أولي"}
            </h2>
            {isReadOnly && (
              <span className="inline-block mt-0.5 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                وضع العرض فقط (غير قابل للتعديل)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {orderId && Cmd.canDeleteProductionOrder(order) && (
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              حذف أمر الإنتاج
            </button>
          )}
          {isReadOnly ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 bg-slate-600 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-medium"
            >
              إغلاق
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
              <Save className="w-4 h-4" />
              حفظ كمسودة
            </button>
          )}
        </div>
      </div>"""

header_replacement = header_target + """

      {!orderId && !isReadOnly && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="creationMode" 
                  value="new" 
                  checked={creationMode === 'new'} 
                  onChange={() => {
                    setCreationMode('new');
                    setSourceOrderId('');
                    // reset order to default
                    setOrder({
                      id: crypto.randomUUID(),
                      orderNumber: generateOrderNumber(),
                      orderDate: new Date().toISOString().split("T")[0],
                      styleName: "",
                      category: "",
                      customerName: "",
                      status: "مسودة",
                      sizes: [],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">أمر إنتاج جديد</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="creationMode" 
                  value="copy" 
                  checked={creationMode === 'copy'} 
                  onChange={() => setCreationMode('copy')}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">استرداد من أمر سابق</span>
              </label>
            </div>
            
            {creationMode === 'copy' && (
              <div className="flex-1 w-full md:w-auto">
                <select 
                  value={sourceOrderId} 
                  onChange={(e) => {
                    const id = e.target.value;
                    setSourceOrderId(id);
                    if (id) {
                      const sourceOrder = previousOrders.find(o => o.id === id);
                      if (sourceOrder) {
                        setOrder({
                          id: crypto.randomUUID(),
                          orderNumber: generateOrderNumber(),
                          orderDate: new Date().toISOString().split("T")[0],
                          styleName: sourceOrder.styleName || "",
                          category: sourceOrder.category || "",
                          customerName: sourceOrder.customerName || "",
                          status: "مسودة",
                          sizes: sourceOrder.sizes ? sourceOrder.sizes.map(s => ({
                            size: s.size,
                            plannedQuantity: s.plannedQuantity,
                            // load standard properties, keep actuals intact if needed
                            // But usually we just copy all size info including quantities
                            variants: s.variants.map(v => ({ color: v.color, quantity: v.quantity, plannedQuantity: v.plannedQuantity || v.quantity }))
                          })) : [],
                          materials: sourceOrder.materials ? JSON.parse(JSON.stringify(sourceOrder.materials)) : [],
                          accessories: sourceOrder.accessories ? JSON.parse(JSON.stringify(sourceOrder.accessories)) : [],
                          printEmbroideryStandardCost: sourceOrder.printEmbroideryStandardCost,
                          standardSewingCostPerPiece: sourceOrder.standardSewingCostPerPiece,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        });
                        setSuccess('تم استرداد بيانات الأمر السابق بنجاح');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">اختر أمر إنتاج سابق...</option>
                  {previousOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} - {o.styleName} ({o.customerName || 'بدون عميل'})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}"""

content = content.replace(header_target, header_replacement)

with open('src/components/ProductionOrderForm.tsx', 'w') as f:
    f.write(content)
