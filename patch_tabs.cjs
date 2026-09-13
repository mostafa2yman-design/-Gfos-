const fs = require('fs');
let content = fs.readFileSync('src/components/OrderManager.tsx', 'utf8');

const getTabStatusFn = `
const getTabStatus = (tab: TabType, order: ProductionOrder): 'approved' | 'saved' | 'pending' => {
  if (!order) return 'pending';
  switch (tab) {
    case 'production':
      return order.productionApprovedAt ? 'approved' : 'saved';
    case 'cut':
      if (order.cutData?.approvedAt) return 'approved';
      if (order.cutData) return 'saved';
      return 'pending';
    case 'batches':
      if (order.batchesLockedAt) return 'approved';
      if (order.batches && order.batches.length > 0) return 'saved';
      return 'pending';
    case 'prep':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.prepStatus === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.prepStatus === 'جاري' || b.prepStatus === 'مكتمل' || (b.accessoriesPrep && b.accessoriesPrep.some(a => a.isPrepared)))) return 'saved';
      }
      return 'pending';
    case 'print':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.printEmbroideryStatus === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.printEmbroideryStatus === 'جاري' || b.printEmbroideryStatus === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'sew':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.sewingData?.status === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.sewingData?.status === 'جاري' || b.sewingData?.status === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'finish':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.finishingData?.status === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.finishingData?.status === 'جاري' || b.finishingData?.status === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'ironing':
      if (order.batches && order.batches.length > 0) {
        if (order.batches.every(b => b.ironingData?.status === 'مكتمل')) return 'approved';
        if (order.batches.some(b => b.ironingData?.status === 'جاري' || b.ironingData?.status === 'مكتمل')) return 'saved';
      }
      return 'pending';
    case 'packing':
      if (order.packingInvoices && order.packingInvoices.length > 0) return 'saved';
      return 'pending';
    default:
      return 'pending';
  }
};

const getTabColorClasses = (isActive: boolean, status: 'approved' | 'saved' | 'pending') => {
  if (isActive) {
    if (status === 'approved') return "bg-emerald-100 text-emerald-800 border-emerald-200 ring-2 ring-emerald-500 shadow-sm";
    if (status === 'saved') return "bg-blue-100 text-blue-800 border-blue-200 ring-2 ring-blue-500 shadow-sm";
    return "bg-red-100 text-red-800 border-red-200 ring-2 ring-red-500 shadow-sm";
  } else {
    if (status === 'approved') return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100";
    if (status === 'saved') return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100";
    return "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100 opacity-75 hover:opacity-100";
  }
};
`;

if (!content.includes('getTabStatus')) {
  content = content.replace(/export function OrderManager/, getTabStatusFn + '\nexport function OrderManager');
}

const tabMatches = [
  { key: 'production', label: 'أمر الإنتاج والخامات', icon: 'FileText' },
  { key: 'cut', label: 'أمر القص الفعلي', icon: 'Scissors' },
  { key: 'batches', label: 'تقسيم الباتشات', icon: 'Layers' },
  { key: 'prep', label: 'التجهيز', icon: 'CheckSquare' },
  { key: 'print', label: 'الطباعة والتطريز', icon: 'Printer' },
  { key: 'sew', label: 'الخياطة', icon: 'Shirt' },
  { key: 'finish', label: 'التشطيب', icon: 'Sparkles' },
  { key: 'ironing', label: 'المكواة', icon: 'Settings2' }, // need to check icon for ironing. Wait, let's use regex that doesn't care about icon.
];

for (const tab of tabMatches) {
  const regex = new RegExp('<button\\s+onClick=\\{\\(\\) => setActiveTab\\("' + tab.key + '"\\)\\}\\s+className=\\{[\\s\\S]*?\\}\\s*>\\s*<([a-zA-Z0-9]+) className="w-5 h-5" \\/>\\s*' + tab.label + '\\s*<\\/button>');
  
  content = content.replace(regex, (match, iconName) => {
    return '<button\n          onClick={() => setActiveTab("' + tab.key + '")}\n          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "' + tab.key + '", getTabStatus("' + tab.key + '", order))}`}\n        >\n          <' + iconName + ' className="w-5 h-5" />\n          ' + tab.label + '\n        </button>';
  });
}

// Special case for packing since the label might be slightly different or icon different.
const regexPacking = new RegExp('<button\\s+onClick=\\{\\(\\) => setActiveTab\\("packing"\\)\\}\\s+className=\\{[\\s\\S]*?\\}\\s*>\\s*<([a-zA-Z0-9]+) className="w-5 h-5" \\/>\\s*(.*?)\\s*<\\/button>');
content = content.replace(regexPacking, (match, iconName, label) => {
    return '<button\n          onClick={() => setActiveTab("packing")}\n          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border ${getTabColorClasses(activeTab === "packing", getTabStatus("packing", order))}`}\n        >\n          <' + iconName + ' className="w-5 h-5" />\n          ' + label + '\n        </button>';
});

fs.writeFileSync('src/components/OrderManager.tsx', content);
