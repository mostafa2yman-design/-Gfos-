const fs = require('fs');
let content = fs.readFileSync('src/components/SewingForm.tsx', 'utf8');

const replacement = `      {!isReadOnly && batches.length > 0 && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium shadow-sm"
          >
            <Save className="w-5 h-5" />
            حفظ مؤقت
          </button>
          <button
            onClick={handleApprove}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-sm"
          >
            <Check className="w-5 h-5" />
            اعتماد الخياطة
          </button>
        </div>
      )}
      {isReadOnly && batches.length > 0 && (
        <div className="flex justify-center mt-6">
           <div className="flex items-center gap-2 px-8 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-sm font-bold text-lg">
              <Check className="w-6 h-6" />
              تم الاعتماد
           </div>
        </div>
      )}`;

content = content.replace(/\{\!isReadOnly && batches\.length > 0 && \([\s\S]*?اعتماد الخياطة\s*<\/button>\s*<\/div>\s*\)\}/, replacement);
fs.writeFileSync('src/components/SewingForm.tsx', content);
