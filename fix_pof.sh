sed -i 's/interface ProductionOrderFormProps {/interface ProductionOrderFormProps {\n  onOrderSaved: (orderId: string) => void;\n  onOrderApproved: (orderId: string) => void;\n  onBack: () => void;/g' src/components/ProductionOrderForm.tsx
sed -i 's/  onSaved: () => void;//g' src/components/ProductionOrderForm.tsx
sed -i 's/export function ProductionOrderForm({ orderId, onSaved, onDeleted, isViewOnly = false }: ProductionOrderFormProps) {/export function ProductionOrderForm({ orderId, onOrderSaved, onOrderApproved, onDeleted, onBack, isViewOnly = false }: ProductionOrderFormProps) {/g' src/components/ProductionOrderForm.tsx

sed -i 's/onSaved(); \/\/ notify parent/onOrderSaved(order.id);/g' src/components/ProductionOrderForm.tsx
# But handleApproveOrder should call onOrderApproved
sed -i 's/setSuccess('\''تم اعتماد أمر الإنتاج بنجاح.'\'');\n        setError(null);\n        if (result.data) setOrder(result.data);\n        onOrderSaved(order.id);/setSuccess('\''تم اعتماد أمر الإنتاج بنجاح.'\'');\n        setError(null);\n        if (result.data) setOrder(result.data);\n        onOrderApproved(order.id);/g' src/components/ProductionOrderForm.tsx
