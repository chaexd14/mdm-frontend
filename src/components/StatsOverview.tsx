'use client';

import React from 'react';
import { Monitor, CheckCircle2, AlertTriangle, Wrench, Zap } from 'lucide-react';
import { Kiosk } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
      label: 'Total Fleet',
      value: total,
      subtext: 'Across all registered sites',
      icon: Monitor,
      iconClass: 'text-muted-foreground',
    },
    {
      id: 'online',
      label: 'Active Online',
      value: onlineCount,
      subtext: 'Heartbeat < 90s threshold',
      icon: CheckCircle2,
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      badge: total > 0 ? `${Math.round((onlineCount / total) * 100)}%` : undefined,
    },
    {
      id: 'offline',
      label: 'Offline Devices',
      value: offlineCount,
      subtext: 'No signal ≥ 90s',
      icon: AlertTriangle,
      iconClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'maintenance',
      label: 'Maintenance Mode',
      value: maintenanceCount,
      subtext: 'Customer banner active',
      icon: Wrench,
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'commands',
      label: 'Pending Commands',
      value: pendingCommandsCount,
      subtext: 'Awaiting C# Agent poll',
      icon: Zap,
      iconClass: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isSelected = selectedFilter === stat.id;
        return (
          <Card
            key={stat.id}
            size="sm"
            onClick={() => onSelectFilter(stat.id === 'commands' ? 'all' : stat.id)}
            className={cn(
              'cursor-pointer transition-all duration-150 select-none p-3.5 gap-2 justify-between',
              isSelected
                ? 'bg-card ring-2 ring-primary border-primary/50 shadow-sm'
                : 'hover:border-border hover:bg-muted/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <div className="flex items-center gap-1.5">
                {stat.badge && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 font-normal"
                  >
                    {stat.badge}
                  </Badge>
                )}
                <Icon className={cn('size-4', stat.iconClass)} />
              </div>
            </div>

            <div>
              <div className="text-2xl font-semibold text-foreground tracking-tight leading-none">
                {stat.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{stat.subtext}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
