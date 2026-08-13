import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'error', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
  const borderColor = type === 'success' ? 'border-emerald-500' : type === 'error' ? 'border-red-500' : 'border-blue-500';
  const textColor = type === 'success' ? 'text-emerald-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4" dir="rtl">
      <div className={`${bgColor} border-r-4 ${borderColor} p-4 rounded-lg shadow-lg flex items-start gap-3 ${textColor}`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="font-medium flex-1">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
