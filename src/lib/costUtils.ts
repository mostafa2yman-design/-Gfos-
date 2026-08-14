import { ProductionOrder } from '../types';

export interface GlobalCostMetrics {
  totalStandardCost: number;
  totalStandardQty: number;
  averageStandardUnitCost: number;
  isActualComplete: boolean;
}

export function calculateGlobalCostMetrics(orders: ProductionOrder[]): GlobalCostMetrics {
  let totalStandardCost = 0;
  let totalStandardQty = 0;

  orders.forEach(order => {
    // 1. Calculate Standard Quantities per size for the order
    const sizeQuantities: Record<string, number> = {};
    order.sizes?.forEach(s => {
      let sQty = 0;
      s.variants?.forEach(v => {
        sQty += v.quantity;
        totalStandardQty += v.quantity;
      });
      sizeQuantities[s.size] = sQty;
    });

    // 2. Calculate Standard Materials Cost
    order.materials?.forEach(mat => {
      const price = mat.standardPrice || 0;
      order.sizes?.forEach(s => {
        const sQty = sizeQuantities[s.size] || 0;
        const std = mat.standardMethod === 'موحد' 
          ? (mat.unifiedStandard || 0)
          : (mat.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
        totalStandardCost += (sQty * std * price);
      });
    });

    // 3. Calculate Standard Accessories Cost
    order.accessories?.forEach(acc => {
      const price = acc.standardPrice || 0;
      order.sizes?.forEach(s => {
        const sQty = sizeQuantities[s.size] || 0;
        const std = acc.standardMethod === 'موحد' 
          ? (acc.unifiedStandard || 0)
          : (acc.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
        totalStandardCost += (sQty * std * price);
      });
    });

    // 4. Calculate Standard Print/Embroidery Cost
    let orderTotalQty = 0;
    order.sizes?.forEach(s => {
      s.variants?.forEach(v => { orderTotalQty += v.quantity; });
    });
    totalStandardCost += (order.printEmbroideryStandardCost || 0) * orderTotalQty;

  });

  const averageStandardUnitCost = totalStandardQty > 0 ? (totalStandardCost / totalStandardQty) : 0;

  return {
    totalStandardCost,
    totalStandardQty,
    averageStandardUnitCost,
    isActualComplete: false // We don't have actual prices or full actual consumption in the current system
  };
}

export interface CostComponent {
  standardTotal: number;
  standardPerPiece: number;
  actualTotal: number | null;
  actualPerPiece: number | null;
  isActualAvailable: boolean;
}

export interface OrderCostAnalysis {
  standardQty: number;
  actualQty: number;
  
  fabric: CostComponent;
  accessories: CostComponent;
  printEmbroidery: CostComponent;
  
  totalStandardPerPiece: number;
  totalActualPerPiece: number | null;
  
  deviationValue: number | null;
  deviationPercentage: number | null;
  isActualComplete: boolean;
}

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

  const fabric: CostComponent = {
    standardTotal: fabricStdTotal,
    standardPerPiece: standardQty > 0 ? (fabricStdTotal / standardQty) : 0,
    actualTotal: null, // No actual price fields exist in the system for materials
    actualPerPiece: null,
    isActualAvailable: false
  };

  // 2. Accessories
  let accStdTotal = 0;
  order.accessories?.forEach(acc => {
    const price = acc.standardPrice || 0;
    order.sizes?.forEach(s => {
      const sQty = sizeQuantities[s.size] || 0;
      const std = acc.standardMethod === 'موحد' 
        ? (acc.unifiedStandard || 0)
        : (acc.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
      accStdTotal += (sQty * std * price);
    });
  });

  const accessories: CostComponent = {
    standardTotal: accStdTotal,
    standardPerPiece: standardQty > 0 ? (accStdTotal / standardQty) : 0,
    actualTotal: null, // No actual price fields exist in the system for accessories
    actualPerPiece: null,
    isActualAvailable: false
  };

  // 3. Print / Embroidery
  let peStdTotal = (order.printEmbroideryStandardCost || 0) * standardQty;
  let peActualTotal = 0;
  let peStandardPieces = standardQty; // Quantities involved in printing standard
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
      
      // peStdTotal is now calculated outside the loop based on the order level setting
      peStandardPieces += batchQty;

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
    standardPerPiece: standardQty > 0 ? (peStdTotal / standardQty) : 0, // Using total order standardQty to amortize cost per piece across the whole order
    actualTotal: isPrintActualAvailable ? peActualTotal : null,
    actualPerPiece: (isPrintActualAvailable && actualQty > 0) ? (peActualTotal / actualQty) : null,
    isActualAvailable: isPrintActualAvailable || (!hasPrintBatches && order.batches && order.batches.length > 0) // if batches exist but none have print, it's 0 and available
  };
  
  if (!hasPrintBatches && order.batches && order.batches.length > 0) {
     printEmbroidery.actualTotal = 0;
     printEmbroidery.actualPerPiece = 0;
     printEmbroidery.isActualAvailable = true;
  }

  // Totals
  const totalStandardPerPiece = fabric.standardPerPiece + accessories.standardPerPiece + printEmbroidery.standardPerPiece;
  
  // To have a complete actual total, ALL components must have an actual cost.
  // Since we don't have actual material/accessory prices, the actual total will always be incomplete unless we consider what's available.
  // The prompt says: "لا تعرض رقمًا نهائيًا مضللًا ... التكلفة الفعلية غير مكتملة"
  
  const isActualComplete = fabric.isActualAvailable && accessories.isActualAvailable && printEmbroidery.isActualAvailable;
  
  let totalActualPerPiece: number | null = null;
  let deviationValue: number | null = null;
  let deviationPercentage: number | null = null;

  if (isActualComplete) {
    totalActualPerPiece = (fabric.actualPerPiece || 0) + (accessories.actualPerPiece || 0) + (printEmbroidery.actualPerPiece || 0);
    deviationValue = totalActualPerPiece - totalStandardPerPiece;
    deviationPercentage = totalStandardPerPiece > 0 ? (deviationValue / totalStandardPerPiece) * 100 : 0;
  }

  return {
    standardQty,
    actualQty,
    fabric,
    accessories,
    printEmbroidery,
    totalStandardPerPiece,
    totalActualPerPiece,
    deviationValue,
    deviationPercentage,
    isActualComplete
  };
}
