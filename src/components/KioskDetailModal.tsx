'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  RotateCcw,
  Power,
  Globe,
  Clock,
  Laptop,
  Radio,
  MapPin,
  CheckCircle2,
  Zap,
  Save,
  Link,
  Edit3,
  Tag,
} from 'lucide-react';
import { Kiosk, KioskCommand } from '@/lib/types';

interface KioskDetailModalProps {
  kiosk: Kiosk | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUrl: (deviceId: string, url: string) => Promise<void>;
  onUpdateDetails?: (
    deviceId: string,
    data: { name?: string; newDeviceId?: string; location?: string; os?: string }
  ) => Promise<void>;
  onSendRestart: (deviceId: string) => void;
  onSendShutdown: (deviceId: string) => void;
  onOpenMaintenance: (kiosk: Kiosk) => void;
}

export function KioskDetailModal({
  kiosk,
  isOpen,
  onClose,
  onUpdateUrl,
  onUpdateDetails,
  onSendRestart,
  onSendShutdown,
  onOpenMaintenance,
}: KioskDetailModalProps) {
  if (!isOpen || !kiosk) return null;

  const [name, setName] = useState(kiosk.name || '');
  const [deviceIdInput, setDeviceIdInput] = useState(kiosk.deviceId || '');
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const [url, setUrl] = useState(kiosk.kioskUrl || kiosk.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [commands, setCommands] = useState<KioskCommand[]>([]);

  useEffect(() => {
    setName(kiosk.name || '');
    setDeviceIdInput(kiosk.deviceId || '');
    setUrl(kiosk.kioskUrl || kiosk.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  }, [kiosk]);

  useEffect(() => {
    if (isOpen && kiosk) {
      fetch(`/api/kiosks/commands?deviceId=${kiosk.deviceId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.commands) {
            setCommands(data.data.commands);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, kiosk]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deviceIdInput.trim()) return;
    setIsUpdatingDetails(true);
    try {
      if (onUpdateDetails) {
        await onUpdateDetails(kiosk.deviceId, {
          name: name.trim(),
          newDeviceId: deviceIdInput.trim().toUpperCase(),
        });
      }
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUrl(true);
    try {
      await onUpdateUrl(kiosk.deviceId, url);
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {kiosk.name}
                <code className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {kiosk.deviceId}
                </code>
              </h3>
              <p className="text-xs text-slate-400">
                Tablet Identity, Remote Actions & History
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

        <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
          {/* Telemetry Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-500">Status</span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${kiosk.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                ></span>
                <span className={kiosk.status === 'online' ? 'text-emerald-400' : 'text-rose-400'}>
                  {kiosk.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-500">Location</span>
              <div className="flex items-center gap-1 mt-1 font-semibold text-xs text-white">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate">{kiosk.location || 'Manila'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-500">OS Version</span>
              <div className="flex items-center gap-1 mt-1 font-semibold text-xs text-white">
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{kiosk.os || 'Windows 11'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-500">Versions</span>
              <div className="mt-1 font-mono text-[11px] text-cyan-300">
                Agent: {kiosk.agentVersion} / App: {kiosk.appVersion}
              </div>
            </div>
          </div>

          {/* Device Identity & Information Edit Form */}
          <form onSubmit={handleSaveDetails} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                Edit Device Name & Device ID
              </h4>
              {detailsSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Identity Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-400" /> Device Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Manila Store Kiosk 01"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-cyan-400" /> Device ID (Hardware Key)
                </label>
                <input
                  type="text"
                  value={deviceIdInput}
                  onChange={(e) => setDeviceIdInput(e.target.value)}
                  placeholder="e.g. KIOSK-MNL-001"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 font-semibold uppercase"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isUpdatingDetails}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdatingDetails ? 'Saving...' : 'Save Tablet Info'}</span>
              </button>
            </div>
          </form>

          {/* Quick Remote Command Triggers */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Dispatch Remote Command
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => onSendRestart(kiosk.deviceId)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Windows Tablet</span>
              </button>
              <button
                onClick={() => onSendShutdown(kiosk.deviceId)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all active:scale-95"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Shutdown Tablet</span>
              </button>
              <button
                onClick={() => onOpenMaintenance(kiosk)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Set Maintenance Mode</span>
              </button>
            </div>
          </div>

          {/* Central KioskUrl Configuration Section */}
          <form onSubmit={handleSaveUrl} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Central Target URL (`kioskUrl`)
              </h4>
              {urlSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Active!
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://app.hotel.saikotechsolutions.com/guest-booking/..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingUrl}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdatingUrl ? 'Saving...' : 'Update KioskUrl'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
              <a
                href={`/api/kiosks/${kiosk.deviceId}/config`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                Inspect GET /api/kiosks/{kiosk.deviceId}/config ↗
              </a>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                Open Target Web App ↗
              </a>
            </div>
          </form>


          {/* Command History for this Device */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Device Command Log
            </h4>
            {commands.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                No recent commands recorded for this tablet.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {commands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white capitalize">{cmd.type}</span>
                      <span className="text-[10px] font-mono text-slate-500">ID: {cmd.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(cmd.createdAt).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cmd.status === 'executed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                          }`}
                      >
                        {cmd.status === 'executed' ? 'Executed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

