import re

with open('src/lib/costUtils.ts', 'r') as f:
    content = f.read()

# I will replace the calculateOrderCostAnalysis function entirely.
# Also I need to import calculateFabricAnalysis and getPrimaryFabric

new_func = """import { calculateFabricAnalysis, getPrimaryFabric } from './fabricUtils';

export function calculateOrderCostAnalysis(order: ProductionOrder): OrderCostAnalysis {
  let standardQty = 0;
  const sizeQuantities: Record<string, number> = {};
  order.sizes?.forEach(s => {
    let sQty = 0;
    s.variants?.forEach(v => {
      sQty += v.quantity;
      standardQty += v.quantity;
    });
    sizeQuantities[s.size] = sQty;
  });

  let actualQty = 0;
  if (order.cutData) {
    order.cutData.sizes?.forEach(s => {
      s.variants?.forEach(v => {
        actualQty += v.actualQuantity || 0;
      });
    });
  }

  // 1. Fabric
  let fabricStdTotal = 0;
  order.materials?.forEach(mat => {
    const price = mat.standardPrice || 0;
    order.sizes?.forEach(s => {
      const sQty = sizeQuantities[s.size] || 0;
      const std = mat.standardMethod === 'موحد' 
        ? (mat.unifiedStandard || 0)
        : (mat.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
      fabricStdTotal += (sQty * std * price);
    });
  });

  const fabricAnalysis = calculateFabricAnalysis(order, order.cutData);
  const isFabricActualAvailable = !!(fabricAnalysis && fabricAnalysis.hasColorLevelActuals && fabricAnalysis.totalActualFabric > 0);
  
  let fabricActualTotal: number | null = null;
  let primaryFabricId = getPrimaryFabric(order)?.id;
  
  if (isFabricActualAvailable && fabricAnalysis) {
     let actualFabricCost = 0;
     // Primary fabric cost based on actual cut weights
     actualFabricCost += fabricAnalysis.totalActualFabric * fabricAnalysis.fabricPrice;

     // Add secondary materials (assuming standard consumption for the actual cut pieces)
     order.materials?.forEach(mat => {
       if (mat.id !== primaryFabricId) {
         const price = mat.standardPrice || 0;
         order.cutData?.sizes?.forEach(s => {
           const sQty = s.variants.reduce((sum, v) => sum + (v.actualQuantity || 0), 0);
           const std = mat.standardMethod === 'موحد' 
             ? (mat.unifiedStandard || 0)
             : (mat.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
           actualFabricCost += (sQty * std * price);
         });
       }
     });
     fabricActualTotal = actualFabricCost;
  }

  const fabric: CostComponent = {
    standardTotal: fabricStdTotal,
    standardPerPiece: standardQty > 0 ? (fabricStdTotal / standardQty) : 0,
    actualTotal: fabricActualTotal,
    actualPerPiece: (fabricActualTotal !== null && actualQty > 0) ? (fabricActualTotal / actualQty) : null,
    isActualAvailable: isFabricActualAvailable
  };

  // 2. Accessories
  let accStdTotal = 0;
  let accActualTotal = 0;
  let hasAnyPreppedBatch = false;

  order.accessories?.forEach(acc => {
    const price = acc.standardPrice || 0;
    // Standard total
    order.sizes?.forEach(s => {
      const sQty = sizeQuantities[s.size] || 0;
      const std = acc.standardMethod === 'موحد' 
        ? (acc.unifiedStandard || 0)
        : (acc.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
      accStdTotal += (sQty * std * price);
    });

    // Actual total based on PREPPED batches (as per requirements: الاكسسوارات يتم اضافتها بمجرد اعتماد التجهيز)
    order.batches?.forEach(b => {
      if (b.prepStatus === 'مكتمل') {
        hasAnyPreppedBatch = true;
        b.sizes?.forEach(bs => {
          const sQty = bs.variants.reduce((sum, v) => sum + v.quantity, 0);
          const std = acc.standardMethod === 'موحد' 
            ? (acc.unifiedStandard || 0)
            : (acc.sizeStandards?.find(ss => ss.size === bs.size)?.standard || 0);
          accActualTotal += (sQty * std * price);
        });
      }
    });
  });

  const accessories: CostComponent = {
    standardTotal: accStdTotal,
    standardPerPiece: standardQty > 0 ? (accStdTotal / standardQty) : 0,
    actualTotal: hasAnyPreppedBatch ? accActualTotal : null,
    actualPerPiece: hasAnyPreppedBatch && actualQty > 0 ? (accActualTotal / actualQty) : null,
    isActualAvailable: hasAnyPreppedBatch || (order.accessories?.length === 0)
  };

  // 3. Print / Embroidery
  let peStdTotal = (order.printEmbroideryStandardCost || 0) * standardQty;
  let peActualTotal = 0;
  let peActualPieces = 0;
  let hasIncompleteActualPrint = false;
  let hasPrintBatches = false;

  order.batches?.forEach(b => {
    if (b.executionType && b.executionType !== 'بدون طباعة / تطريز') {
      hasPrintBatches = true;
      let batchQty = 0;
      b.sizes.forEach(bs => {
        bs.variants.forEach(bv => {
          batchQty += bv.quantity;
        });
      });
      
      const actCost = b.printEmbroideryCost?.actualCost;
      if (actCost !== undefined && actCost !== null && !isNaN(actCost)) {
        peActualTotal += (batchQty * actCost);
        peActualPieces += batchQty;
      } else {
        hasIncompleteActualPrint = true;
      }
    }
  });

  const isPrintActualAvailable = hasPrintBatches && !hasIncompleteActualPrint;
  const printEmbroidery: CostComponent = {
    standardTotal: peStdTotal,
    standardPerPiece: order.printEmbroideryStandardCost || 0,
    actualTotal: isPrintActualAvailable ? peActualTotal : null,
    actualPerPiece: (isPrintActualAvailable && actualQty > 0) ? (peActualTotal / actualQty) : null,
    isActualAvailable: isPrintActualAvailable || (!hasPrintBatches && order.batches && order.batches.length > 0)
  };

  if (!hasPrintBatches && order.batches && order.batches.length > 0) {
     printEmbroidery.actualTotal = 0;
     printEmbroidery.actualPerPiece = 0;
     printEmbroidery.isActualAvailable = true;
  }

  // 4. Sewing
  let sewingStdTotal = (order.standardSewingCostPerPiece || 0) * standardQty;
  let sewingActualTotal = 0;
  let sewingActualPieces = 0;
  let hasIncompleteActualSewing = false;
  let hasSewingBatches = false;

  order.batches?.forEach(b => {
    if (b.sewingData) {
      hasSewingBatches = true;
      let batchActualQty = 0;
      b.sewingData.actualQuantities?.forEach(q => {
        batchActualQty += q.actualQuantity;
      });
      
      const actCost = b.sewingData.actualCostPerPiece;
      if (actCost !== undefined && actCost !== null && !isNaN(actCost) && batchActualQty > 0) {
        sewingActualTotal += (batchActualQty * actCost);
        sewingActualPieces += batchActualQty;
      } else if (b.sewingData.status !== 'مكتمل') {
        hasIncompleteActualSewing = true;
      }
    } else {
       hasIncompleteActualSewing = true;
    }
  });

  const isSewingActualAvailable = hasSewingBatches && !hasIncompleteActualSewing;
  const sewing: CostComponent = {
    standardTotal: sewingStdTotal,
    standardPerPiece: order.standardSewingCostPerPiece || 0,
    actualTotal: isSewingActualAvailable ? sewingActualTotal : null,
    actualPerPiece: (isSewingActualAvailable && sewingActualPieces > 0) ? (sewingActualTotal / sewingActualPieces) : null,
    isActualAvailable: isSewingActualAvailable || (!hasSewingBatches && order.batches && order.batches.length > 0)
  };

  if (!hasSewingBatches && order.batches && order.batches.length > 0) {
    sewing.actualTotal = 0;
    sewing.actualPerPiece = 0;
    sewing.isActualAvailable = true;
  }

  // Totals
  const totalStandardPerPiece = fabric.standardPerPiece + accessories.standardPerPiece + printEmbroidery.standardPerPiece + sewing.standardPerPiece;
  
  const isActualComplete = fabric.isActualAvailable && accessories.isActualAvailable && printEmbroidery.isActualAvailable && sewing.isActualAvailable;
  
  let totalActualPerPiece: number | null = null;
  let deviationValue: number | null = null;
  let deviationPercentage: number | null = null;

  if (isActualComplete) {
    totalActualPerPiece = (fabric.actualPerPiece || 0) + (accessories.actualPerPiece || 0) + (printEmbroidery.actualPerPiece || 0) + (sewing.actualPerPiece || 0);
    deviationValue = totalActualPerPiece - totalStandardPerPiece;
    deviationPercentage = totalStandardPerPiece > 0 ? (deviationValue / totalStandardPerPiece) * 100 : 0;
  }

  return {
    standardQty,
    actualQty,
    fabric,
    accessories,
    printEmbroidery,
    sewing,
    totalStandardPerPiece,
    totalActualPerPiece,
    deviationValue,
    deviationPercentage,
    isActualComplete
  };
}"""

# We need to insert the import at the top if it's not there, and replace the function.
if "import { calculateFabricAnalysis" not in content:
    content = "import { calculateFabricAnalysis, getPrimaryFabric } from './fabricUtils';\n" + content

# Replace function
content = re.sub(r'export function calculateOrderCostAnalysis\(order: ProductionOrder\): OrderCostAnalysis \{.*', new_func, content, flags=re.DOTALL)

with open('src/lib/costUtils.ts', 'w') as f:
    f.write(content)

