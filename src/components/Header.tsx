'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
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
  onOpenRegister,
  onOpenCommandQueue,
  pendingCommandsCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand Title */}
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Kiosk Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Fleet Telemetry & Remote Control
          </p>
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Auto Refresh Selector with ToggleGroup */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1 text-xs">
            <span className="text-muted-foreground text-[11px]">
              Auto:
            </span>
            <ToggleGroup
              value={[String(autoRefreshInterval)]}
              onValueChange={(val) => {
                if (val && val.length > 0) {
                  setAutoRefreshInterval(Number(val[0]));
                }
              }}
              size="sm"
              variant="outline"
              className="gap-0.5"
            >
              {[
                { label: 'Off', val: '0' },
                { label: '5s', val: '5' },
                { label: '15s', val: '15' },
                { label: '30s', val: '30' },
              ].map((opt) => (
                <ToggleGroupItem
                  key={opt.val}
                  value={opt.val}
                  className="h-6 px-2 text-[11px]"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Manual Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-1.5"
            title="Refresh kiosk statuses and telemetry"
          >
            <RefreshCw
              data-icon="inline-start"
              className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
          </Button>

          {/* Pending Commands Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandQueue}
            className="h-8 gap-1.5"
            title="View command queue & execution logs"
          >
            <span>Commands</span>
            {pendingCommandsCount > 0 && (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] ml-0.5"
              >
                {pendingCommandsCount}
              </Badge>
            )}
          </Button>

          {/* Register Kiosk Button */}
          <Button
            variant="default"
            size="sm"
            onClick={onOpenRegister}
            className="h-8"
          >
            <span>Add Tablet</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
