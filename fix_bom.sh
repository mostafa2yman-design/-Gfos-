sed -i "s/onChange: (field: 'materials' | 'accessories', value: any\[\]) => void;/onChange: (field: 'materials' | 'accessories', value: any) => void;/g" src/components/form/BomSection.tsx
sed -i "s/value: any\[\]/value: (MaterialInstance\[\] | AccessoryInstance\[\])/g" src/components/ProductionOrderForm.tsx
