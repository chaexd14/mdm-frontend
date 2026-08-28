'use client';

import React, { useState } from 'react';
import { Plus, X, Laptop, MapPin, CheckCircle2, Shield } from 'lucide-react';

interface RegisterKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
    kioskUrl?: string;
  }) => Promise<void>;
}

export function RegisterKioskModal({
  isOpen,
  onClose,
  onRegister,
}: RegisterKioskModalProps) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('Manila');
  const [os, setOs] = useState('Windows 11 Pro');
  const [agentVersion, setAgentVersion] = useState('1.0.0');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [kioskUrl, setKioskUrl] = useState('https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim()) return;

    setIsSubmitting(true);
    try {
      await onRegister({
        deviceId: deviceId.trim().toUpperCase(),
        deviceName: deviceName.trim() || deviceId.trim(),
        location,
        os,
        agentVersion,
        appVersion,
        kioskUrl: kioskUrl.trim() || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli',
      });
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Register New Kiosk Tablet
              </h3>
              <p className="text-xs text-slate-400">
                Enroll a new physical tablet into the fleet
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300">
                Device ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. KIOSK-MNL-002"
                required
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300">
                Tablet Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Manila Store Kiosk 02"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                Target Web App URL (<code className="text-cyan-300 font-mono">kioskUrl</code>)
              </label>
              <input
                type="url"
                value={kioskUrl}
                onChange={(e) => setKioskUrl(e.target.value)}
                placeholder="https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Deployment Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Manila"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Operating System
              </label>
              <input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="e.g. Windows 11 Pro"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Agent Version
              </label>
              <input
                type="text"
                value={agentVersion}
                onChange={(e) => setAgentVersion(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Kiosk App Version
              </label>
              <input
                type="text"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>


          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Once enrolled, the C# agent on the tablet will authenticate with this Device ID to send heartbeats and receive remote commands.
            </span>
          </div>

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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
