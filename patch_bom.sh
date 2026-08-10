sed -i "s/value: any) => void/value: MaterialInstance\[\] | AccessoryInstance\[\]) => void/g" src/components/form/BomSection.tsx
sed -i "s/value: any) {/value: string | number | { size: string; standard: number }\[\]) {/g" src/components/form/BomSection.tsx
sed -i "s/updateFn: (field: any, value: any) => void/updateFn: (field: keyof MaterialInstance | keyof AccessoryInstance, value: number) => void/g" src/components/form/BomSection.tsx
