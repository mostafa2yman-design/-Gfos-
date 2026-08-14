const fs = require('fs');

// Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  `type ViewState = 'dashboard' | 'list' | 'form';`,
  `type ViewState = 'dashboard' | 'list' | 'form' | 'settings';`
);

if (!appCode.includes(`import { Settings } from './components/Settings';`)) {
  appCode = appCode.replace(
    `import { OrderManager } from './components/OrderManager';`,
    `import { OrderManager } from './components/OrderManager';\nimport { Settings } from './components/Settings';`
  );
}

if (!appCode.includes(`currentView === 'settings'`)) {
  appCode = appCode.replace(
    `    </Layout>`,
    `      {currentView === 'settings' && (
        <Settings onBack={handleBackToList} />
      )}
    </Layout>`
  );
}

fs.writeFileSync('src/App.tsx', appCode);

// Update Layout.tsx
let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!layoutCode.includes(`Settings as SettingsIcon`)) {
  layoutCode = layoutCode.replace(
    `import { Factory, LayoutDashboard, ListPlus, FileText } from 'lucide-react';`,
    `import { Factory, LayoutDashboard, ListPlus, FileText, Settings as SettingsIcon } from 'lucide-react';`
  );
}

layoutCode = layoutCode.replace(
  `currentView: 'dashboard' | 'list' | 'form';`,
  `currentView: 'dashboard' | 'list' | 'form' | 'settings';`
);

layoutCode = layoutCode.replace(
  `onNavigate: (view: 'dashboard' | 'list' | 'form') => void;`,
  `onNavigate: (view: 'dashboard' | 'list' | 'form' | 'settings') => void;`
);

if (!layoutCode.includes(`onNavigate('settings')`)) {
  layoutCode = layoutCode.replace(
    `            <button
              onClick={() => onNavigate('form')}`,
    `            <button
              onClick={() => onNavigate('settings')}
              className={\`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors \${
                currentView === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }\`}
            >
              <SettingsIcon className="w-4 h-4" />
              الإعدادات
            </button>
            <button
              onClick={() => onNavigate('form')}`
  );
}

fs.writeFileSync('src/components/Layout.tsx', layoutCode);
