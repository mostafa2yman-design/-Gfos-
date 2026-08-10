sed -i "s/value: string | number/value: string | number | boolean/g" src/components/PrintPrepSheet.tsx
sed -i "s/value: number) => void/value: number | { size: string; standard: number }\[\]) => void/g" src/components/form/BomSection.tsx
