'use client';

import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Kiosk } from '@/lib/types';
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
    <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40 border-b border-border">
          <TableRow>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Device ID & Name</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Target URL</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Location</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">OS & Versions</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Last Seen</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Mode</TableHead>
            <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kiosks.map((kiosk) => {
            const online = isOnline(kiosk.lastSeen);
            const currentUrl = kiosk.kioskUrl || kiosk.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli';
            return (
              <TableRow
                key={kiosk.deviceId}
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

                {/* Device ID & Name */}
                <TableCell className="py-2.5 px-4">
                  <div className="text-xs font-medium text-foreground">
                    {kiosk.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <code className="font-mono text-[11px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
                      {kiosk.deviceId}
                    </code>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => navigator.clipboard.writeText(kiosk.deviceId)}
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                        />
                      }>
                        <Copy className="size-2.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Copy Device ID</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>

                {/* Target Kiosk URL */}
                <TableCell className="py-2.5 px-4 max-w-[200px]">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-[11px] text-muted-foreground" title={currentUrl}>
                      {currentUrl}
                    </span>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Open URL in new tab"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap text-xs text-foreground">
                  {kiosk.location || 'Manila'}
                </TableCell>

                {/* OS & Versions */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                  <div className="text-foreground">{kiosk.os}</div>
                  <div className="text-[10px] text-muted-foreground">
                    v{kiosk.agentVersion} / v{kiosk.appVersion}
                  </div>
                </TableCell>

                {/* Last Seen */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                  <div>{getRelativeTime(kiosk.lastSeen)}</div>
                </TableCell>

                {/* Maintenance Mode */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                  {kiosk.maintenanceMode ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-normal"
                    >
                      Maintenance
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Normal</span>
                  )}
                </TableCell>

                {/* Action Buttons */}
                <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendRestart(kiosk.deviceId)}
                      disabled={isActionLoading}
                      className="h-6 px-2 text-[11px]"
                    >
                      Restart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendShutdown(kiosk.deviceId)}
                      disabled={isActionLoading}
                      className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      Shutdown
                    </Button>
                    <Button
                      variant={kiosk.maintenanceMode ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => onOpenMaintenance(kiosk)}
                      className="h-6 px-2 text-[11px]"
                    >
                      {kiosk.maintenanceMode ? 'Exit Maint.' : 'Maint.'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetail(kiosk)}
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
