sed -i 's/id: crypto.randomUUID(), //g' src/lib/storage.ts
sed -i '/id: crypto.randomUUID(),/d' src/lib/storage.ts
