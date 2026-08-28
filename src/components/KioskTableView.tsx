'use client';

import React from 'react';
import {
  RotateCcw,
  Power,
  Wrench,
  Sliders,
  Copy,
  Clock,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Kiosk } from '@/lib/types';

interface KioskTableViewProps {
  kiosks: Kiosk[];
  onSendRestart: (deviceId: string) => void;
  onSendShutdown: (deviceId: string) => void;
  onOpenMaintenance: (kiosk: Kiosk) => void;
  onOpenDetail: (kiosk: Kiosk) => void;
  isActionLoading?: boolean;
}

export function KioskTableView({
  kiosks,
  onSendRestart,
  onSendShutdown,
  onOpenMaintenance,
  onOpenDetail,
  isActionLoading,
}: KioskTableViewProps) {
  const getRelativeTime = (lastSeen?: string | null) => {
    if (!lastSeen) return 'Never seen';
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000));
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  const isOnline = (lastSeen?: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 90 * 1000;
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/80 text-xs font-medium text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Device ID & Name</th>
            <th className="py-3.5 px-4">Target Kiosk URL</th>
            <th className="py-3.5 px-4">Location</th>
            <th className="py-3.5 px-4">OS & Versions</th>
            <th className="py-3.5 px-4">Last Seen</th>
            <th className="py-3.5 px-4">Mode</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {kiosks.map((kiosk) => {
            const online = isOnline(kiosk.lastSeen);
            const currentUrl = kiosk.kioskUrl || kiosk.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli';
            return (
              <tr
                key={kiosk.deviceId}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Status Indicator */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      online
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    ></span>
                    <span>{online ? 'Online' : 'Offline'}</span>
                  </div>
                </td>

                {/* Device ID & Name */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {kiosk.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <code className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      {kiosk.deviceId}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(kiosk.deviceId)}
                      className="text-slate-500 hover:text-slate-300 p-0.5"
                      title="Copy deviceId"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </td>

                {/* Target Kiosk URL */}
                <td className="py-3.5 px-4 max-w-[200px]">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-[11px] text-indigo-300" title={currentUrl}>
                      {currentUrl}
                    </span>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-indigo-300 transition-colors shrink-0"
                      title="Open URL"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </td>

                {/* Location */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                    {kiosk.location || 'Manila'}
                  </span>
                </td>

                {/* OS & Versions */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                  <div>{kiosk.os}</div>
                  <div className="text-[10px] text-slate-500">
                    Agent: v{kiosk.agentVersion} | App: v{kiosk.appVersion}
                  </div>
                </td>

                {/* Last Seen */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{getRelativeTime(kiosk.lastSeen)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {kiosk.lastSeen ? new Date(kiosk.lastSeen).toLocaleTimeString() : '-'}
                  </div>
                </td>

                {/* Maintenance Mode */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {kiosk.maintenanceMode ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Wrench className="w-2.5 h-2.5" />
                      Maintenance
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Normal</span>
                  )}
                </td>


                {/* Action Buttons */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onSendRestart(kiosk.deviceId)}
                      disabled={isActionLoading}
                      className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 transition-colors disabled:opacity-50"
                      title="Restart Kiosk"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSendShutdown(kiosk.deviceId)}
                      disabled={isActionLoading}
                      className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors disabled:opacity-50"
                      title="Shutdown Kiosk"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenMaintenance(kiosk)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        kiosk.maintenanceMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="Toggle Maintenance"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenDetail(kiosk)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Details & Config"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

