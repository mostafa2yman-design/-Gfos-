sed -i 's/variant.id/variant.color || idx/g' src/components/form/SizeCard.tsx
sed -i 's/variantId: string/colorName: string/g' src/components/form/SizeCard.tsx
sed -i 's/variant.color || idx, field, value/variant.color, field, value/g' src/components/form/SizeCard.tsx
sed -i 's/onRemove={() => onRemoveVariant(variant.color || idx)/onRemove={() => onRemoveVariant(variant.color)/g' src/components/form/SizeCard.tsx
