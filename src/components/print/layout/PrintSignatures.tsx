import React from 'react';

interface Signature {
  role: string;
}

interface PrintSignaturesProps {
  signatures: Signature[];
}

export const PrintSignatures: React.FC<PrintSignaturesProps> = ({ signatures = [] }) => {
  return (
    <div className="mt-8 pt-4 border-t border-slate-300 break-inside-avoid">
      <div className={`grid gap-4 text-center`} style={{ gridTemplateColumns: `repeat(${signatures.length}, minmax(0, 1fr))` }}>
        {signatures.map((sig, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <p className="font-bold mb-8 text-[11px]">{sig.role}</p>
            <div className="border-b border-dashed border-slate-500 w-32 mb-2"></div>
            <p className="text-[9px] text-slate-500">الاسم / التوقيع</p>
          </div>
        ))}
      </div>
    </div>
  );
};
