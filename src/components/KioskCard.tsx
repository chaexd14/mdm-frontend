'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Laptop,
  Globe,
  RotateCcw,
  Power,
  Wrench,
  Sliders,
  Tablet,
} from 'lucide-react';
import { Kiosk } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
    <Card className="group relative flex flex-col transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      {/* Top Card Header: Tablet Name, Device ID, Status Pill */}
      <CardHeader className="p-4 pb-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Tablet className="size-4 text-primary shrink-0" />
              <CardTitle className="text-sm font-medium text-foreground truncate">
                {kiosk.name}
              </CardTitle>
              {kiosk.maintenanceMode && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-normal"
                >
                  Maintenance
                </Badge>
              )}
            </div>

            {/* Copyable Device ID */}
            <div className="flex items-center gap-1.5 mt-1">
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {kiosk.deviceId}
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
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="flex flex-col items-end">
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

            <span className="text-[11px] text-muted-foreground mt-1">
              {relativeTime}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-2.5 flex-1">
        {/* Target Kiosk URL Box */}
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="size-3 text-muted-foreground" />
              <span>Target URL</span>
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
            <span className="text-foreground">{kiosk.location || 'Manila'}</span>
          </div>
          <div className="text-muted-foreground bg-muted/20 p-2 rounded border border-border truncate">
            <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mb-0.5">
              <Laptop className="size-2.5" />
              <span>OS</span>
            </span>
            <span className="text-foreground">{kiosk.os || 'Windows 11'}</span>
          </div>
        </div>

        {/* Version Tags & Flags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Badge variant="secondary" className="px-1.5 py-0.5 font-normal">
            Agent: v{kiosk.agentVersion}
          </Badge>
          <Badge variant="secondary" className="px-1.5 py-0.5 font-normal">
            App: v{kiosk.appVersion}
          </Badge>
          {kiosk.allowTransactions && (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-normal">
              Transactions
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Card Action Buttons Footer */}
      <CardFooter className="p-3 pt-2.5 mt-auto border-t border-border flex items-center justify-between gap-2 bg-muted/10">
        <div className="flex items-center gap-1">
          {/* Quick Restart */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendRestart(kiosk.deviceId)}
            disabled={isActionLoading}
            className="h-7 px-2 text-xs gap-1"
            title="Send Restart Command to C# Agent"
          >
            <RotateCcw data-icon="inline-start" className="size-3" />
            <span>Restart</span>
          </Button>

          {/* Quick Shutdown */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendShutdown(kiosk.deviceId)}
            disabled={isActionLoading}
            className="h-7 px-2 text-xs gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
            title="Send Shutdown Command to C# Agent"
          >
            <Power data-icon="inline-start" className="size-3" />
            <span>Shutdown</span>
          </Button>

          {/* Maintenance Toggle */}
          <Button
            variant={kiosk.maintenanceMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onOpenMaintenance(kiosk)}
            className="h-7 px-2 text-xs gap-1"
            title="Toggle Maintenance Mode"
          >
            <Wrench data-icon="inline-start" className="size-3" />
            <span>{kiosk.maintenanceMode ? 'Exit' : 'Maint.'}</span>
          </Button>
        </div>

        {/* View Details / Config */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenDetail(kiosk)}
          className="h-7 px-2 text-xs text-primary gap-1"
          title="Inspect Telemetry & Settings"
        >
          <Sliders data-icon="inline-start" className="size-3" />
          <span>Details</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
