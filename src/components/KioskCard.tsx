'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Power,
  Wrench,
  Sliders,
  Copy,
  Check,
  MapPin,
  Laptop,
  Clock,
  ShieldCheck,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Kiosk } from '@/lib/types';

interface KioskCardProps {
  kiosk: Kiosk;
  onSendRestart: (deviceId: string) => void;
  onSendShutdown: (deviceId: string) => void;
  onOpenMaintenance: (kiosk: Kiosk) => void;
  onOpenDetail: (kiosk: Kiosk) => void;
  isActionLoading?: boolean;
}

export function KioskCard({
  kiosk,
  onSendRestart,
  onSendShutdown,
  onOpenMaintenance,
  onOpenDetail,
  isActionLoading,
}: KioskCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Live timer calculating exact relative lastSeen
  useEffect(() => {
    const updateTime = () => {
      if (!kiosk.lastSeen) {
        setRelativeTime('Never seen');
        setSecondsAgo(999999);
        return;
      }

      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(kiosk.lastSeen).getTime()) / 1000));
      setSecondsAgo(diffSec);

      if (diffSec < 10) {
        setRelativeTime('Active just now');
      } else if (diffSec < 60) {
        setRelativeTime(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        setRelativeTime(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setRelativeTime(`${Math.floor(diffSec / 3600)}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [kiosk.lastSeen]);

  const isOnline = secondsAgo < 90;
  const currentUrl = kiosk.kioskUrl || kiosk.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(kiosk.deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-indigo-500/40 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/20 hover:-translate-y-0.5">
      {/* Top Header: Tablet Name, Device ID, Status Pill */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
              {kiosk.name}
            </h3>
            {kiosk.maintenanceMode && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <Wrench className="w-2.5 h-2.5" />
                Maintenance
              </span>
            )}
          </div>

          {/* Copyable Device ID */}
          <div className="flex items-center gap-1.5 mt-1">
            <code className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
              {kiosk.deviceId}
            </code>
            <button
              onClick={handleCopyId}
              className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Copy device ID"
            >
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex flex-col items-end">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              ></span>
            </span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
            <Clock className="w-2.5 h-2.5 text-slate-500" />
            {relativeTime}
          </span>
        </div>
      </div>

      {/* Target Kiosk URL Box */}
      <div className="my-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300 text-xs">
            <Globe className="w-3 h-3 text-indigo-400" />
            Target URL (<code className="text-cyan-300 lowercase font-mono">kioskUrl</code>)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyUrl}
              className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Copy URL"
            >
              {copiedUrl ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="font-mono text-xs text-indigo-300 break-all line-clamp-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          {currentUrl}
        </div>
      </div>

      {/* Device Telemetry Specs */}
      <div className="grid grid-cols-2 gap-2 my-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate font-medium text-slate-300">{kiosk.location || 'Manila'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <Laptop className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate font-medium text-slate-300">{kiosk.os || 'Windows 11'}</span>
        </div>
      </div>

      {/* Version Tags & Flags */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400 my-1">
        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
          Agent: v{kiosk.agentVersion}
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
          App: v{kiosk.appVersion}
        </span>
        {kiosk.allowTransactions && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" />
            Transactions enabled
          </span>
        )}
      </div>


      {/* Card Action Buttons Toolbar */}
      <div className="pt-3 mt-auto border-t border-slate-800/80 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          {/* Quick Restart */}
          <button
            onClick={() => onSendRestart(kiosk.deviceId)}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            title="Send Restart Command to C# Agent"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restart</span>
          </button>

          {/* Quick Shutdown */}
          <button
            onClick={() => onSendShutdown(kiosk.deviceId)}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            title="Send Shutdown Command to C# Agent"
          >
            <Power className="w-3 h-3" />
            <span>Shutdown</span>
          </button>

          {/* Maintenance Toggle */}
          <button
            onClick={() => onOpenMaintenance(kiosk)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
              kiosk.maintenanceMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
            }`}
            title="Toggle Maintenance Mode"
          >
            <Wrench className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Details / Config */}
        <button
          onClick={() => onOpenDetail(kiosk)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all active:scale-95"
          title="Inspect Telemetry & Settings"
        >
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span>Config</span>
        </button>
      </div>
    </div>
  );
}

