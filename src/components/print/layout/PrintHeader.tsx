import React from 'react';
import { getFactorySettings } from '../../../lib/storage';

interface PrintHeaderProps {
  documentTitle: string;
  orderNumber?: string;
  date?: string;
  modelName?: string;
  clientName?: string;
  companyName?: string;
  additionalInfo?: Array<{ label: string; value: string | number }>;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ 
  documentTitle, 
  orderNumber, 
  date,
  modelName,
  clientName,
  companyName = "GFOS ERP",
  additionalInfo = []
}) => {
  const defaultDate = new Date().toLocaleDateString('ar-EG');
  const factory = getFactorySettings();
  
  return (
    <div className="border-b-2 border-slate-800 pb-3 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {factory?.logoUrl && (
            <img src={factory.logoUrl} alt="Logo" className="w-12 h-12 object-contain grayscale" />
          )}
          <div>
            <h1 className="text-[18px] font-bold text-slate-800">{factory?.name || companyName}</h1>
            <h2 className="text-[16px] font-bold text-slate-700 mt-1">{documentTitle}</h2>
          </div>
        </div>
        <div className="text-left text-[11px] text-slate-600 flex flex-col items-end gap-1">
          {orderNumber && <p><span className="font-bold">رقم الأمر:</span> {orderNumber}</p>}
          <p><span className="font-bold">تاريخ الطباعة:</span> {date || defaultDate}</p>
        </div>
      </div>
      
      {/* Dynamic Data Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] bg-slate-50 p-2 border border-slate-200 rounded">
        {factory?.phones && <div><span className="font-bold inline-block w-20">أرقام التواصل:</span> {factory.phones}</div>}
        {factory?.address && <div><span className="font-bold inline-block w-20">العنوان:</span> {factory.address}</div>}
        {modelName && <div><span className="font-bold inline-block w-20">الموديل:</span> {modelName}</div>}
        {clientName && <div><span className="font-bold inline-block w-20">العميل:</span> {clientName}</div>}
        {additionalInfo.map((info, idx) => (
          <div key={idx}><span className="font-bold inline-block w-20">{info.label}:</span> {info.value}</div>
        ))}
      </div>
    </div>
  );
};
