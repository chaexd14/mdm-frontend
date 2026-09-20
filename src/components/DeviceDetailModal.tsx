'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Lock,
  Unlock,
  Wrench,
  RotateCcw,
  Battery,
  BatteryCharging,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Device, DeviceCommand } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DeviceDetailModalProps {
  device?: Device | null;
  kiosk?: Device | null; // backwards compatibility alias
  isOpen: boolean;
  onClose: () => void;
  onUpdateUrl: (deviceId: string, url: string) => Promise<void>;
  onUpdateDetails?: (
    deviceId: string,
    data: { name?: string; newDeviceId?: string; location?: string; os?: string; model?: string; manufacturer?: string }
  ) => Promise<void>;
  onSendReload?: (deviceId: string) => void;
  onSendLockDevice?: (deviceId: string) => void;
  onSendUnlockDevice?: (deviceId: string) => void;
  onSendLockKiosk?: (deviceId: string) => void;
  onSendUnlockKiosk?: (deviceId: string) => void;
  onSendRestart?: (deviceId: string) => void;
  onSendShutdown?: (deviceId: string) => void;
  onOpenMaintenance: (device: Device) => void;
  onDeleteDevice?: (deviceId: string) => Promise<void>;
}

export function DeviceDetailModal({
  device: deviceProp,
  kiosk: kioskProp,
  isOpen,
  onClose,
  onUpdateUrl,
  onUpdateDetails,
  onSendReload,
  onSendLockDevice,
  onSendUnlockDevice,
  onSendLockKiosk,
  onSendUnlockKiosk,
  onSendRestart,
  onSendShutdown,
  onOpenMaintenance,
  onDeleteDevice,
}: DeviceDetailModalProps) {
  const device = deviceProp || kioskProp;
  const [name, setName] = useState(device?.name || '');
  const [deviceIdInput, setDeviceIdInput] = useState(device?.deviceId || '');
  const [locationInput, setLocationInput] = useState(device?.location || '');
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [url, setUrl] = useState(device?.targetUrl || device?.kioskUrl || device?.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [commands, setCommands] = useState<DeviceCommand[]>([]);

  useEffect(() => {
    if (device) {
      setName(device.name || '');
      setDeviceIdInput(device.deviceId || '');
      setLocationInput(device.location || 'Manila');
      setUrl(device.targetUrl || device.kioskUrl || device.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
    }
  }, [device]);

  useEffect(() => {
    if (isOpen && device) {
      fetch(`/api/devices/commands?deviceId=${device.deviceId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.commands) {
            setCommands(data.data.commands);
          }
        })
        .catch(() => {
          // Fallback to legacy endpoint if needed
          fetch(`/api/kiosks/commands?deviceId=${device.deviceId}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.data?.commands) {
                setCommands(data.data.commands);
              }
            })
            .catch(console.error);
        });
    }
  }, [isOpen, device]);

  if (!device) return null;

  const isLocked = device.lockTaskState === 'LOCKED' || device.lockTaskState === 'PINNED';

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deviceIdInput.trim()) return;
    setIsUpdatingDetails(true);
    try {
      if (onUpdateDetails) {
        await onUpdateDetails(device.deviceId, {
          name: name.trim(),
          newDeviceId: deviceIdInput.trim().toUpperCase(),
          location: locationInput.trim(),
        });
      }
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUrl(true);
    try {
      await onUpdateUrl(device.deviceId, url);
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingUrl(false);
    }
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              <span>{device.name}</span>
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {device.deviceId}
              </code>
              {device.isDeviceOwner && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs font-normal gap-1">
                  <ShieldCheck className="size-3" />
                  <span>Device Owner</span>
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Android Device Identity, Hardware Telemetry & MDM Controls
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 my-2 p-1 pr-2">
          {/* Telemetry Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Status */}
            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Status</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span
                  className={`size-1.5 rounded-full ${
                    device.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
                <span className={device.status === 'online' ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-rose-700 dark:text-rose-400 font-medium'}>
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </Card>

            {/* Battery & Charging */}
            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Battery & Power</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-mono">
                {device.isCharging ? (
                  <BatteryCharging className="size-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Battery className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span>{device.batteryLevel !== undefined ? `${device.batteryLevel}%` : 'N/A'}</span>
                {device.isCharging && <Zap className="size-3 text-amber-500 fill-amber-500" />}
              </div>
            </Card>

            {/* Lock Task Mode */}
            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Lock Task Mode</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {isLocked ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Lock className="size-3" />
                    {device.lockTaskState || 'LOCKED'}
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Unlock className="size-3" />
                    {device.lockTaskState || 'NONE'}
                  </span>
                )}
              </div>
            </Card>

            {/* Platform & OS */}
            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Platform & OS</span>
              <div className="mt-1 text-xs text-foreground truncate" title={device.os}>
                {device.os || 'Android'}
              </div>
            </Card>
          </div>

          {/* Device Model & Specs Row if available */}
          {(device.model || device.manufacturer) && (
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Hardware Terminal:</span>
              <span className="font-medium text-foreground">
                {device.manufacturer} {device.model}
              </span>
            </div>
          )}

          {/* Device Identity & Information Edit Form */}
          <Card className="p-4 bg-muted/10">
            <form onSubmit={handleSaveDetails} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-foreground">
                  Device Identity & Location
                </h4>
                {detailsSaved && (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-normal">
                    Saved
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Device Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Front Desk Terminal 01"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Device ID</label>
                  <Input
                    type="text"
                    value={deviceIdInput}
                    onChange={(e) => setDeviceIdInput(e.target.value)}
                    placeholder="e.g. KIOSK-AND-001"
                    className="font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Location</label>
                  <Input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g. Lobby Front Desk"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingDetails}
                >
                  {isUpdatingDetails ? 'Saving...' : 'Save Info'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Quick Remote Command Triggers for Android */}
          <Card className="p-4 bg-muted/10">
            <h4 className="text-xs font-medium text-foreground mb-2">
              Android MDM Remote Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {/* Reload App */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendReload?.(device.deviceId)}
                className="gap-1.5 text-xs"
              >
                <RotateCw className="size-3.5" />
                <span>Reload Managed Web App</span>
              </Button>

              {/* Lock / Unlock Device */}
              {isLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlock}
                  className="gap-1.5 text-xs text-amber-600 hover:bg-amber-500/10 border-amber-500/30"
                >
                  <Unlock className="size-3.5" />
                  <span>Release Lock Task (Unlock Device)</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLock}
                  className="gap-1.5 text-xs text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                >
                  <Lock className="size-3.5" />
                  <span>Engage Lock Task (Lock Device)</span>
                </Button>
              )}

              {/* Maintenance Mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenMaintenance(device);
                }}
                className="gap-1.5 text-xs"
              >
                <Wrench className="size-3.5" />
                <span>Set Maintenance Mode</span>
              </Button>

              {/* Soft Restart */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendRestart?.(device.deviceId)}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="size-3.5" />
                <span>Soft Restart</span>
              </Button>
            </div>
          </Card>

          {/* Central URL Configuration Section */}
          <Card className="p-4 bg-muted/10">
            <form onSubmit={handleSaveUrl} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-foreground">
                  Managed Web App URL (Target Endpoint)
                </h4>
                {urlSaved && (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-normal">
                    Saved & Dispatched
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://app.hotel.saikotechsolutions.com/guest-booking/..."
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingUrl}
                >
                  {isUpdatingUrl ? 'Saving...' : 'Update URL'}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-mono">
                <a
                  href={`/api/devices/${device.deviceId}/config`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  GET /api/devices/{device.deviceId}/config ↗
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit target URL ↗
                </a>
              </div>
            </form>
          </Card>

          {/* Recent Commands Audit History */}
          <Card className="p-4 bg-muted/10">
            <h4 className="text-xs font-medium text-foreground mb-2">
              Recent Command History ({commands.length})
            </h4>
            {commands.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No command records dispatched for this device.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {commands.slice(0, 5).map((cmd) => (
                  <div key={cmd.id} className="flex items-center justify-between p-2 rounded bg-background border border-border text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-foreground uppercase text-[11px]">{cmd.type}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({cmd.id})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          cmd.status === 'executed'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : cmd.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                        )}
                      >
                        {cmd.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(cmd.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <DialogFooter className="pt-2 border-t border-border flex items-center justify-between sm:justify-between w-full">
          {onDeleteDevice ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={async () => {
                if (window.confirm(`Are you sure you want to remove "${device.name}" (${device.deviceId}) from the MDM fleet?`)) {
                  setIsDeleting(true);
                  try {
                    await onDeleteDevice(device.deviceId);
                    onClose();
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
              className="text-xs"
            >
              {isDeleting ? 'Removing...' : 'Remove from Fleet'}
            </Button>
          ) : <div />}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const KioskDetailModal = DeviceDetailModal;
