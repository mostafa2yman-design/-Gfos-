import React, { forwardRef } from 'react';
import { PrintFooter } from './PrintFooter';

interface PrintDocumentProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const PrintDocument = forwardRef<HTMLDivElement, PrintDocumentProps>(
  ({ children, title, className = '' }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`gfos-print-document print-only hidden print:block bg-white text-black w-full font-cairo ${className}`} 
        dir="rtl"
      >
        <div className="print-content">
          {children}
        </div>
        <PrintFooter />
      </div>
    );
  }
);
PrintDocument.displayName = 'PrintDocument';
