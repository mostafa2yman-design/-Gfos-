sed -i 's/onUpdateVariant: (colorName: string/onUpdateVariant: (variantIndex: number/g' src/components/form/SizeCard.tsx
sed -i 's/onRemoveVariant: (colorName: string)/onRemoveVariant: (variantIndex: number)/g' src/components/form/SizeCard.tsx
sed -i 's/onChange={(field, value) => onUpdateVariant(variant.color, field, value)}/onChange={(field, value) => onUpdateVariant(idx, field, value)}/g' src/components/form/SizeCard.tsx
sed -i 's/onRemove={() => onRemoveVariant(variant.color)}/onRemove={() => onRemoveVariant(idx)}/g' src/components/form/SizeCard.tsx
sed -i 's/handleUpdateVariant = (sizeName: string, colorName: string,/handleUpdateVariant = (sizeName: string, variantIndex: number,/g' src/components/ProductionOrderForm.tsx
sed -i 's/updateVariantColor, sizeName, colorName, /updateVariantColor, sizeName, variantIndex, /g' src/components/ProductionOrderForm.tsx
sed -i 's/updateVariantQuantity, sizeName, colorName, /updateVariantQuantity, sizeName, variantIndex, /g' src/components/ProductionOrderForm.tsx
sed -i 's/handleRemoveVariant = (sizeName: string, colorName: string)/handleRemoveVariant = (sizeName: string, variantIndex: number)/g' src/components/ProductionOrderForm.tsx
sed -i 's/removeVariant, sizeName, colorName/removeVariant, sizeName, variantIndex/g' src/components/ProductionOrderForm.tsx
sed -i 's/onUpdateVariant={(colorName, field, value) => handleUpdateVariant(sizeData.size, colorName, field, value)}/onUpdateVariant={(variantIndex, field, value) => handleUpdateVariant(sizeData.size, variantIndex, field, value)}/g' src/components/ProductionOrderForm.tsx
sed -i 's/onRemoveVariant={(colorName) => handleRemoveVariant(sizeData.size, colorName)}/onRemoveVariant={(variantIndex) => handleRemoveVariant(sizeData.size, variantIndex)}/g' src/components/ProductionOrderForm.tsx
