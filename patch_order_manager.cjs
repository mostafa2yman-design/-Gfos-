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
      if (order.packingInvoices && order.packingInvoices.length > 0) return 'saved'; // Packing has no formal "approved" status, but "saved" shows blue.
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

// Modify the tab render logic
function replaceTab(tabKey, label, iconComponent) {
  const regex = new RegExp(\`<button\\s+onClick=\\{\\(\\) => setActiveTab\\("\\$?\\{?${tabKey}\\}?"\\)\\}\\s+className=\\{[\\s\\S]*?\\}\\s*>\\s*<${iconComponent} [^>]+>\\s*${label}\\s*<\\/button>\`);
  
  const replacement = \`<button
          onClick={() => setActiveTab("${tabKey}")}
          className={\`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all border \${getTabColorClasses(activeTab === "${tabKey}", getTabStatus("${tabKey}", order))}\`}
        >
          <${iconComponent} className="w-5 h-5" />
          ${label}
        </button>\`;
  
  content = content.replace(regex, replacement);
}

replaceTab('production', 'أمر الإنتاج والخامات', 'FileText');
replaceTab('cut', 'أمر القص الفعلي', 'Scissors');
replaceTab('batches', 'تقسيم الباتشات', 'Layers');
replaceTab('prep', 'التجهيز', 'CheckSquare');
replaceTab('print', 'الطباعة والتطريز', 'Printer');
replaceTab('sew', 'الخياطة', 'Shirt');
replaceTab('finish', 'التشطيب', 'Sparkles');

// Ironing and packing don't have replace calls yet because I need to check exactly how they are structured.
fs.writeFileSync('src/components/OrderManager.tsx', content);
