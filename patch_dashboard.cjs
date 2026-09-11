const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /const initialQty =.*?batch\.sewingData\?\.actualQuantities[\s\S]*?\} else \{[\s\S]*?preparation\.push\(\{ \.\.\.baseItem, quantity: initialQty, details: "جاري التجهيز" \}\);[\s\S]*?\}[\s\S]*?\}\);/g;

const replacement = `const initialQty = batch.sizes.reduce((sum, size) => sum + size.variants.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0), 0);
        const sewingQty = batch.sewingData?.actualQuantities ? batch.sewingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const finishingQty = batch.finishingData?.actualQuantities ? batch.finishingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const ironingQty = batch.ironingData?.actualQuantities ? batch.ironingData.actualQuantities.reduce((sum, q) => sum + (Number((q as any).actualQuantity) || 0), 0) : 0;
        const needsPrintEmb = batch.executionType && batch.executionType !== "بدون طباعة / تطريز";

        const baseItem = {
          id: \`batch-\${batch.id}\`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          batchNumber: batch.batchNumber,
        };

        if (batch.ironingData?.status === 'مكتمل') {
           packing.push({ ...baseItem, quantity: ironingQty || finishingQty || sewingQty || initialQty, details: "متاح للتغليف", tab: 'packing' });
        } else if (batch.ironingData?.status === 'جاري') {
          ironing.push({ ...baseItem, quantity: finishingQty || sewingQty || initialQty, details: "جاري المكواة", tab: 'ironing' });
        } else if (batch.finishingData?.status === 'مكتمل') {
          ironing.push({ ...baseItem, quantity: finishingQty || sewingQty || initialQty, details: "بانتظار المكواة", tab: 'ironing' });
        } else if (batch.finishingData?.status === 'جاري') {
          finishing.push({ ...baseItem, quantity: sewingQty || initialQty, details: "جاري التشطيب", tab: 'finish' });
        } else if (batch.sewingData?.status === 'مكتمل') {
          finishing.push({ ...baseItem, quantity: sewingQty || initialQty, details: "بانتظار التشطيب", tab: 'finish' });
        } else if (batch.sewingData?.status === 'جاري') {
          sewing.push({ ...baseItem, quantity: initialQty, details: batch.sewingData?.manufacturingType || "جاري الخياطة", tab: 'sew' });
        } else if (needsPrintEmb && (batch.printEmbroideryStatus === 'مكتمل' || batch.printEmbroideryStatus === 'تم التخطي')) {
          sewing.push({ ...baseItem, quantity: initialQty, details: "بانتظار الخياطة", tab: 'sew' });
        } else if (needsPrintEmb && batch.printEmbroideryStatus === 'في المطبعة / التطريز') {
          printEmb.push({ ...baseItem, quantity: initialQty, details: batch.executionType || "في المطبعة/التطريز", tab: 'print' });
        } else if (batch.prepStatus === 'مكتمل') {
          if (needsPrintEmb) {
            printEmb.push({ ...baseItem, quantity: initialQty, details: "بانتظار الطباعة/التطريز", tab: 'print' });
          } else {
            sewing.push({ ...baseItem, quantity: initialQty, details: "بانتظار الخياطة", tab: 'sew' });
          }
        } else {
          preparation.push({ ...baseItem, quantity: initialQty, details: "جاري التجهيز", tab: 'prep' });
        }
      });`;

content = content.replace(/const initialQty = batch\.sizes\.reduce\([\s\S]*?\}\);[\s]*\}\);/g, replacement + '\n    });');

// Add tab to interface
content = content.replace(/isOrderOnly\?: boolean;/g, 'isOrderOnly?: boolean;\n    tab?: string;');

fs.writeFileSync('src/components/Dashboard.tsx', content);
