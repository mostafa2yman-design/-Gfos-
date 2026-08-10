sed -i "s/value: any) => {/value: string | number | { size: string; standard: number }\[\]) => {/g" src/components/form/BomSection.tsx
sed -i "s/updateFn: (field: any, value: MaterialInstance\[\] | AccessoryInstance\[\]) => void/updateFn: (field: keyof MaterialInstance | keyof AccessoryInstance, value: number) => void/g" src/components/form/BomSection.tsx
