'use client';

import React from 'react';
import {
  Monitor,
  RefreshCw,
  Cpu,
  Plus,
  Radio,
  Clock,
} from 'lucide-react';


interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  onOpenSimulator: () => void;
  onOpenRegister: () => void;
  onOpenCommandQueue: () => void;
  pendingCommandsCount: number;
  lastUpdated: Date | null;
}

export function Header({
  onRefresh,
  isLoading,
  autoRefreshInterval,
  setAutoRefreshInterval,
  onOpenSimulator,
  onOpenRegister,
  onOpenCommandQueue,
  pendingCommandsCount,
  lastUpdated,
}: HeaderProps) {

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand & Fleet Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Kiosk<span className="text-cyan-400">Dashboard</span>
            </h1>
          </div>
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Auto Refresh Selector */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Auto:
            </span>
            {[
              { label: 'Off', val: 0 },
              { label: '5s', val: 5 },
              { label: '15s', val: 15 },
              { label: '30s', val: 30 },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setAutoRefreshInterval(opt.val)}
                className={`px-2 py-1 rounded font-medium transition-all ${autoRefreshInterval === opt.val
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all hover:border-slate-600 active:scale-95 disabled:opacity-50"
            title="Refresh kiosk statuses and telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Pending Commands Button */}
          <button
            onClick={onOpenCommandQueue}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all hover:border-slate-600 active:scale-95"
            title="View command queue & execution logs"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Commands</span>
            {pendingCommandsCount > 0 && (
              <span className="flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 animate-pulse">
                {pendingCommandsCount}
              </span>
            )}
          </button>

          {/* Interactive Agent Simulator Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition-all active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>C# Agent Simulator</span>
          </button>

          {/* Register Kiosk Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 border border-indigo-400/30 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tablet</span>
          </button>
        </div>
      </div>
    </header>
  );
}

