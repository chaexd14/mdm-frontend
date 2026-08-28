'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    if (toast.type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (toast.type === 'error') return <AlertCircle className="w-4 h-4 text-rose-400" />;
    return <Info className="w-4 h-4 text-cyan-400" />;
  };

  const getBorder = () => {
    if (toast.type === 'success') return 'border-emerald-500/40 bg-slate-900/95';
    if (toast.type === 'error') return 'border-rose-500/40 bg-slate-900/95';
    return 'border-cyan-500/40 bg-slate-900/95';
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md animate-slideUp ${getBorder()}`}
    >
      <div className="mt-0.5 shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-bold text-white">{toast.title}</h5>
        {toast.message && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-500 hover:text-white p-1 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
