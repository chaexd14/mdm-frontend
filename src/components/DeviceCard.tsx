'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Laptop,
  Globe,
  RotateCw,
  Lock,
  Unlock,
  Wrench,
  Sliders,
  Tablet,
  Battery,
  BatteryCharging,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Device } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface DeviceCardProps {
  device: Device;
  kiosk?: Device; // backwards compatibility alias
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

export function DeviceCard({
  device: deviceProp,
  kiosk: kioskProp,
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
}: DeviceCardProps) {
  const device = deviceProp || kioskProp!;
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Live timer calculating exact relative lastSeen
  useEffect(() => {
    const updateTime = () => {
      if (!device.lastSeen) {
        setRelativeTime('Never seen');
        setSecondsAgo(999999);
        return;
      }

      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(device.lastSeen).getTime()) / 1000));
      setSecondsAgo(diffSec);

      if (diffSec < 10) {
        setRelativeTime('Just now');
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
  }, [device.lastSeen]);

  const isOnline = secondsAgo < 420; // 7 minutes online threshold
  const currentUrl = device.targetUrl || device.kioskUrl || device.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli';
  const isLocked = device.lockTaskState === 'LOCKED' || device.lockTaskState === 'PINNED';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(device.deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLock = () => {
    if (onSendLockDevice) onSendLockDevice(device.deviceId);
    else if (onSendLockKiosk) onSendLockKiosk(device.deviceId);
  };

  const handleUnlock = () => {
    if (onSendUnlockDevice) onSendUnlockDevice(device.deviceId);
    else if (onSendUnlockKiosk) onSendUnlockKiosk(device.deviceId);
  };

  return (
    <Card className="group relative flex flex-col transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      {/* Top Card Header: Device Name, Device ID, Status Pill */}
      <CardHeader className="p-4 pb-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tablet className="size-4 text-primary shrink-0" />
              <CardTitle className="text-sm font-medium text-foreground truncate">
                {device.name}
              </CardTitle>

              {device.maintenanceMode && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-normal"
                >
                  Maintenance
                </Badge>
              )}

              {device.isDeviceOwner && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-normal gap-1"
                >
                  <ShieldCheck className="size-2.5" />
                  <span>Device Owner</span>
                </Badge>
              )}
            </div>

            {/* Copyable Device ID & Model */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {device.deviceId}
              </code>
              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopyId}
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  />
                }>
                  {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                </TooltipTrigger>
                <TooltipContent>
                  <span>{copiedId ? 'Copied!' : 'Copy Device ID'}</span>
                </TooltipContent>
              </Tooltip>

              {device.model && (
                <span className="text-[11px] text-muted-foreground">
                  • {device.model}
                </span>
              )}
            </div>
          </div>

          {/* Live Status Pill & Battery */}
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-normal gap-1.5 px-2 py-0.5',
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
              )}
            >
              <span
                className={cn(
                  'inline-flex rounded-full size-1.5',
                  isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                )}
              ></span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </Badge>

            {/* Battery Indicator if telemetry present */}
            {device.batteryLevel !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                {device.isCharging ? (
                  <BatteryCharging className="size-3 text-amber-500" />
                ) : (
                  <Battery className="size-3 text-muted-foreground" />
                )}
                <span>{device.batteryLevel}%</span>
                {device.isCharging && <Zap className="size-2.5 text-amber-500 fill-amber-500" />}
              </div>
            )}

            <span className="text-[10px] text-muted-foreground">
              {relativeTime}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-2.5 flex-1">
        {/* Managed App URL Box */}
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="size-3 text-muted-foreground" />
              <span>Managed App URL</span>
            </span>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopyUrl}
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  />
                }>
                  {copiedUrl ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                </TooltipTrigger>
                <TooltipContent>
                  <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors inline-flex"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                }>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Open in new tab</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="font-mono text-xs text-foreground/80 break-all line-clamp-1 bg-background p-1.5 rounded border border-border">
            {currentUrl}
          </div>
        </div>

        {/* Device Telemetry Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-muted-foreground bg-muted/20 p-2 rounded border border-border truncate">
            <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mb-0.5">
              <MapPin className="size-2.5" />
              <span>Location</span>
            </span>
            <span className="text-foreground">{device.location || 'Manila'}</span>
          </div>
          <div className="text-muted-foreground bg-muted/20 p-2 rounded border border-border truncate">
            <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mb-0.5">
              <Laptop className="size-2.5" />
              <span>OS / Platform</span>
            </span>
            <span className="text-foreground">{device.os || 'Android'}</span>
          </div>
        </div>

        {/* Version Tags & Security Status */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Badge variant="secondary" className="px-1.5 py-0.5 font-normal">
            App: v{device.appVersion || device.agentVersion}
          </Badge>

          {/* Lock Task Mode Status */}
          {device.lockTaskState && (
            <Badge
              variant="outline"
              className={cn(
                'px-1.5 py-0.5 font-normal text-[10px] gap-1',
                device.lockTaskState === 'LOCKED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : device.lockTaskState === 'PINNED'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isLocked ? <Lock className="size-2.5" /> : <Unlock className="size-2.5" />}
              <span>{device.lockTaskState}</span>
            </Badge>
          )}

          {device.allowTransactions && (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-normal">
              Active
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Card Action Buttons Footer */}
      <CardFooter className="p-3 pt-2.5 mt-auto border-t border-border flex items-center justify-between gap-2 bg-muted/10">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Reload Web App */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendReload?.(device.deviceId)}
            disabled={isActionLoading}
            className="h-7 px-2 text-xs gap-1"
            title="Reload Managed Web App on Device"
          >
            <RotateCw data-icon="inline-start" className="size-3" />
            <span>Reload</span>
          </Button>

          {/* Device Lock / Unlock Toggle */}
          {isLocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlock}
              disabled={isActionLoading}
              className="h-7 px-2 text-xs gap-1 text-amber-600 hover:bg-amber-500/10 border-amber-500/30"
              title="Disengage Lock Task (Unlock Device)"
            >
              <Unlock data-icon="inline-start" className="size-3" />
              <span>Unlock</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLock}
              disabled={isActionLoading}
              className="h-7 px-2 text-xs gap-1 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
              title="Engage Lock Task Mode (Lock Device)"
            >
              <Lock data-icon="inline-start" className="size-3" />
              <span>Lock</span>
            </Button>
          )}

          {/* Maintenance Toggle */}
          <Button
            variant={device.maintenanceMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onOpenMaintenance(device)}
            className="h-7 px-2 text-xs gap-1"
            title="Toggle Device Maintenance Mode"
          >
            <Wrench data-icon="inline-start" className="size-3" />
            <span>{device.maintenanceMode ? 'Exit' : 'Maint.'}</span>
          </Button>
        </div>

        {/* View Details / Config */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenDetail(device)}
          className="h-7 px-2 text-xs text-primary gap-1"
          title="Inspect Device Telemetry & MDM Settings"
        >
          <Sliders data-icon="inline-start" className="size-3" />
          <span>Details</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Backward-compatible alias
export const KioskCard = DeviceCard;
