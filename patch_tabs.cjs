const fs = require('fs');
let content = fs.readFileSync('src/components/OrderManager.tsx', 'utf8');

const replacement = `<button
          onClick={() => setActiveTab("ironing")}
          className={\`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors \${
            activeTab === "ironing"
              ? "bg-violet-50 text-violet-700"
              : "text-slate-600 hover:bg-slate-50"
          }\`}
        >
          <Sparkles className="w-5 h-5" />
          المكواة
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={\`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors \${
            activeTab === "packing"
              ? "bg-teal-50 text-teal-700"
              : "text-slate-600 hover:bg-slate-50"
          }\`}
        >
          <Package className="w-5 h-5" />
          التغليف
        </button>
      </div>`;

content = content.replace(/<button\s*onClick=\{\(\) => setActiveTab\("ironing"\)\}[\s\S]*?المكواة\s*<\/button>\s*<\/div>/, replacement);

fs.writeFileSync('src/components/OrderManager.tsx', content);
