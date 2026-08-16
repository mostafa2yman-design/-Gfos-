import React from 'react';

interface PrintSectionProps {
  title?: string;
  children: React.ReactNode;
  avoidBreak?: boolean;
}

export const PrintSection: React.FC<PrintSectionProps> = ({ title, children, avoidBreak = false }) => {
  return (
    <div className={`mb-4 ${avoidBreak ? 'break-inside-avoid' : ''}`}>
      {title && (
        <h3 className="font-bold text-[12px] border-b-2 border-slate-200 pb-1 mb-2 text-slate-800">
          {title}
        </h3>
      )}
      <div className="text-[10px]">
        {children}
      </div>
    </div>
  );
};
