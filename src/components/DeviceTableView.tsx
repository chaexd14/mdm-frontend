'use client';

import React from 'react';
import { Copy, ExternalLink, RotateCw, Lock, Unlock, Battery, BatteryCharging, Zap, ShieldCheck } from 'lucide-react';
import { Device } from '@/lib/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface DeviceTableViewProps {
  devices?: Device[];
  kiosks?: Device[]; // backwards compatibility alias
  onSendReload?: (deviceId: string) => void;
  onSendLockDevice?: (deviceId: string) => void;
  onSendUnlockDevice?: (deviceId: string) => void;
  onSendLockKiosk?: (deviceId: string) => void;
  onSendUnlockKiosk?: (deviceId: string) => void;
  onSendRestart?: (deviceId: string) => void;
  onSendShutdown?: (deviceId: string) => void;
  onOpenMaintenance: (device: Device) => void;
  onOpenDetail: (device: Device) => void;
  isActionLoading?: boolean;
}

export function DeviceTableView({
  devices: devicesProp,
  kiosks: kiosksProp,
  onSendReload,
  onSendLockDevice,
  onSendUnlockDevice,
  onSendLockKiosk,
  onSendUnlockKiosk,
  onSendRestart,
  onSendShutdown,
  onOpenMaintenance,
  onOpenDetail,
  isActionLoading,
}: DeviceTableViewProps) {
  const devices = devicesProp || kiosksProp || [];

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
    return Date.now() - new Date(lastSeen).getTime() < 7 * 60 * 1000;
  };

  const handleLock = (deviceId: string) => {
    if (onSendLockDevice) onSendLockDevice(deviceId);
    else if (onSendLockKiosk) onSendLockKiosk(deviceId);
  };

  const handleUnlock = (deviceId: string) => {
    if (onSendUnlockDevice) onSendUnlockDevice(deviceId);
    else if (onSendUnlockKiosk) onSendUnlockKiosk(deviceId);
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40 border-b border-border">
          <TableRow>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Device ID & Name</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Power / Battery</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Target URL</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Location</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">OS / Security</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Last Seen</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Mode</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const online = isOnline(device.lastSeen);
            const currentUrl = device.targetUrl || device.kioskUrl || device.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli';
            const isLocked = device.lockTaskState === 'LOCKED' || device.lockTaskState === 'PINNED';

            return (
              <TableRow
                key={device.deviceId}
                className="hover:bg-muted/30 transition-colors"
              >
                {/* Status Indicator */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-normal gap-1.5 px-2 py-0.5',
                      online
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        online ? 'bg-emerald-500' : 'bg-rose-500'
                      )}
                    ></span>
                    <span>{online ? 'Online' : 'Offline'}</span>
                  </Badge>
                </TableCell>

                {/* Device Name, ID & Owner status */}
                <TableCell className="py-2.5 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground truncate max-w-[170px]">
                      {device.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {device.deviceId}
                      </code>
                      {device.isDeviceOwner && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[9px] px-1 py-0">
                          MDM Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Battery & Power Column */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                  {device.batteryLevel !== undefined ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                      {device.isCharging ? (
                        <BatteryCharging className="size-3.5 text-amber-500" />
                      ) : (
                        <Battery className="size-3.5 text-muted-foreground" />
                      )}
                      <span>{device.batteryLevel}%</span>
                      {device.isCharging && <Zap className="size-2.5 text-amber-500 fill-amber-500" />}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </TableCell>

                {/* URL */}
                <TableCell className="py-2.5 px-4 max-w-[200px]">
                  <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground truncate">
                    <span className="truncate" title={currentUrl}>
                      {currentUrl}
                    </span>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell className="py-2.5 px-4 text-xs text-foreground whitespace-nowrap">
                  {device.location || 'Manila'}
                </TableCell>

                {/* OS & Lock Task Mode */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">{device.os || 'Android'}</span>
                    {device.lockTaskState && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] px-1 py-0 w-fit gap-0.5 font-mono',
                          device.lockTaskState === 'LOCKED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                            : device.lockTaskState === 'PINNED'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isLocked ? <Lock className="size-2" /> : <Unlock className="size-2" />}
                        <span>{device.lockTaskState}</span>
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Last Seen */}
                <TableCell className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  {getRelativeTime(device.lastSeen)}
                </TableCell>

                {/* Status Badges */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {device.maintenanceMode ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                        Maintenance
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Action Buttons */}
                <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {/* Reload App */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendReload?.(device.deviceId)}
                      disabled={isActionLoading}
                      className="h-6 px-2 text-[11px] gap-1"
                      title="Reload Managed Web App on Android Device"
                    >
                      <RotateCw className="size-2.5" />
                      <span>Reload</span>
                    </Button>

                    {/* Lock / Unlock */}
                    {isLocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlock(device.deviceId)}
                        disabled={isActionLoading}
                        className="h-6 px-2 text-[11px] gap-1 text-amber-600 hover:bg-amber-500/10 border-amber-500/30"
                        title="Release Lock Task Mode"
                      >
                        <Unlock className="size-2.5" />
                        <span>Unlock</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLock(device.deviceId)}
                        disabled={isActionLoading}
                        className="h-6 px-2 text-[11px] gap-1 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                        title="Engage Lock Task Mode"
                      >
                        <Lock className="size-2.5" />
                        <span>Lock</span>
                      </Button>
                    )}

                    {/* Maintenance */}
                    <Button
                      variant={device.maintenanceMode ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => onOpenMaintenance(device)}
                      className="h-6 px-2 text-[11px]"
                    >
                      {device.maintenanceMode ? 'Exit' : 'Maint.'}
                    </Button>

                    {/* Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetail(device)}
                      className="h-6 px-2 text-[11px] text-primary"
                    >
                      Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Backward-compatible alias
export const KioskTableView = DeviceTableView;
