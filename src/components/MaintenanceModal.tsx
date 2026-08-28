'use client';

import React, { useState } from 'react';
import { Wrench, X, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { Kiosk } from '@/lib/types';

interface MaintenanceModalProps {
  kiosk: Kiosk | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (deviceId: string, enabled: boolean, message?: string) => Promise<void>;
}

export function MaintenanceModal({
  kiosk,
  isOpen,
  onClose,
  onSave,
}: MaintenanceModalProps) {
  if (!isOpen || !kiosk) return null;

  const [enabled, setEnabled] = useState(kiosk.maintenanceMode);
  const [message, setMessage] = useState(
    kiosk.maintenanceMessage || 'This kiosk is temporarily unavailable.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(kiosk.deviceId, enabled, enabled ? message : undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Maintenance Mode Settings
              </h3>
              <p className="text-xs text-slate-400">
                Target: <span className="text-cyan-400 font-mono">{kiosk.deviceId}</span> ({kiosk.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">
                Enable Maintenance Mode
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Block customer interactions and display maintenance banner
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Custom Message input if enabled */}
          {enabled && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Custom Maintenance Notice (shown on tablet screen)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="e.g. This kiosk is temporarily unavailable. Please visit counter 2."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50"
              />
              <p className="text-[11px] text-slate-500">
                Tablet will automatically poll this notice on its next heartbeat or config check.
              </p>

              {/* Live Preview Box */}
              <div className="mt-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
                <div className="inline-flex p-1.5 rounded-full bg-amber-500/20 text-amber-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-amber-300">
                  Under Maintenance
                </h4>

                <p className="text-xs text-amber-200/90 mt-1 font-medium">
                  {message || 'This kiosk is temporarily unavailable.'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Save Mode'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
