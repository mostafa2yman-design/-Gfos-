sed -i 's/handleRemoveSize(sizeData.id)/handleRemoveSize(sizeData.size)/g' src/components/ProductionOrderForm.tsx
sed -i 's/sizeId: string/sizeName: string/g' src/components/ProductionOrderForm.tsx
sed -i 's/executeCommand(Cmd.removeSize, sizeId)/executeCommand(Cmd.removeSize, sizeName)/g' src/components/ProductionOrderForm.tsx
sed -i 's/sourceSizeId: string/sourceSizeName: string/g' src/components/ProductionOrderForm.tsx
sed -i 's/executeCommand(Cmd.copySize, sourceSizeId/executeCommand(Cmd.copySize, sourceSizeName/g' src/components/ProductionOrderForm.tsx
sed -i 's/handleCopySize(sizeData.id/handleCopySize(sizeData.size/g' src/components/ProductionOrderForm.tsx
sed -i 's/handleAddVariant(sizeData.id)/handleAddVariant(sizeData.size)/g' src/components/ProductionOrderForm.tsx
sed -i 's/variantId: string/colorName: string/g' src/components/ProductionOrderForm.tsx
sed -i 's/handleUpdateVariant(sizeData.id, vId/handleUpdateVariant(sizeData.size, v.color/g' src/components/ProductionOrderForm.tsx
sed -i 's/handleRemoveVariant(sizeData.id, vId)/handleRemoveVariant(sizeData.size, v.color)/g' src/components/ProductionOrderForm.tsx
sed -i 's/executeCommand(Cmd.addVariant, sizeId/executeCommand(Cmd.addVariant, sizeName/g' src/components/ProductionOrderForm.tsx
sed -i 's/executeCommand(Cmd.updateVariantColor, sizeId, variantId/executeCommand(Cmd.updateVariantColor, sizeName, colorName/g' src/components/ProductionOrderForm.tsx
sed -i 's/executeCommand(Cmd.updateVariantQuantity, sizeId, variantId/executeCommand(Cmd.updateVariantQuantity, sizeName, colorName/g' src/components/ProductionOrderForm.tsx
sed -i 's/executeCommand(Cmd.removeVariant, sizeId, variantId)/executeCommand(Cmd.removeVariant, sizeName, colorName)/g' src/components/ProductionOrderForm.tsx
