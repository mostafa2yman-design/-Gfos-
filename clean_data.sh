sed -i 's/const STORAGE_KEY = '\''production_orders_v0.1'\'';/const STORAGE_KEY = '\''production_orders_v0.3'\'';/g' src/lib/storage.ts
sed -i '/export const initializeDummyData = () => {/,/};/d' src/lib/storage.ts
sed -i '/import { initializeDummyData } from '\''\.\/lib\/storage'\'';/d' src/App.tsx
sed -i '/initializeDummyData();/d' src/App.tsx
