'use client';

import React from 'react';
import { Monitor, CheckCircle2, AlertTriangle, Wrench, Zap } from 'lucide-react';
import { Kiosk } from '@/lib/types';

interface StatsOverviewProps {
  kiosks: Kiosk[];
  pendingCommandsCount: number;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export function StatsOverview({
  kiosks,
  pendingCommandsCount,
  selectedFilter,
  onSelectFilter,
}: StatsOverviewProps) {
  const total = kiosks.length;
  const onlineCount = kiosks.filter((k) => k.status === 'online').length;
  const offlineCount = kiosks.filter((k) => k.status === 'offline').length;
  const maintenanceCount = kiosks.filter((k) => k.maintenanceMode).length;

  const stats = [
    {
      id: 'all',
      label: 'Total Fleet Tablets',
      value: total,
      subtext: 'Across all registered sites',
      icon: Monitor,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-400',
    },
    {
      id: 'online',
      label: 'Active Online',
      value: onlineCount,
      subtext: 'Heartbeat < 90s threshold',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400',
      activeGlow: 'shadow-emerald-950/30 ring-1 ring-emerald-500/40',
    },
    {
      id: 'offline',
      label: 'Offline Devices',
      value: offlineCount,
      subtext: 'No signal ≥ 90s',
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-400',
    },
    {
      id: 'maintenance',
      label: 'Maintenance Mode',
      value: maintenanceCount,
      subtext: 'Customer banner active',
      icon: Wrench,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400',
    },
    {
      id: 'commands',
      label: 'Pending Commands',
      value: pendingCommandsCount,
      subtext: 'Awaiting C# Agent poll',
      icon: Zap,
      color: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 my-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isSelected = selectedFilter === stat.id;
        return (
          <button
            key={stat.id}
            onClick={() => onSelectFilter(stat.id === 'commands' ? 'all' : stat.id)}
            className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40 translate-y-[-2px]'
                : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-medium text-slate-400">{stat.label}</span>
              <div className={`p-1.5 rounded-lg border bg-gradient-to-br ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </span>
              {stat.id === 'online' && total > 0 && (
                <span className="text-[11px] font-semibold text-emerald-400">
                  {Math.round((onlineCount / total) * 100)}%
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-1 truncate">{stat.subtext}</p>
          </button>
        );
      })}
    </div>
  );
}
