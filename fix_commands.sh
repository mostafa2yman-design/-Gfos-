sed -i 's/sizeId: string/sizeName: string/g' src/lib/productionOrderCommands.ts
sed -i 's/s.id !== sizeId/s.size !== sizeName/g' src/lib/productionOrderCommands.ts
sed -i 's/sourceSizeId: string/sourceSizeName: string/g' src/lib/productionOrderCommands.ts
sed -i 's/s.id === sourceSizeId/s.size === sourceSizeName/g' src/lib/productionOrderCommands.ts
sed -i 's/variantId: string/colorName: string/g' src/lib/productionOrderCommands.ts
sed -i 's/size.id === sizeId/size.size === sizeName/g' src/lib/productionOrderCommands.ts
sed -i 's/v.id !== variantId/v.color !== colorName/g' src/lib/productionOrderCommands.ts
sed -i 's/v.id === variantId/v.color !== "" \&\& v.color === colorName/g' src/lib/productionOrderCommands.ts
sed -i '/id: crypto.randomUUID(),/d' src/lib/productionOrderCommands.ts
