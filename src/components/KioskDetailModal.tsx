'use client';

import React, { useState, useEffect } from 'react';
import { Kiosk, KioskCommand } from '@/lib/types';
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

interface KioskDetailModalProps {
  kiosk: Kiosk | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUrl: (deviceId: string, url: string) => Promise<void>;
  onUpdateDetails?: (
    deviceId: string,
    data: { name?: string; newDeviceId?: string; location?: string; os?: string }
  ) => Promise<void>;
  onSendRestart: (deviceId: string) => void;
  onSendShutdown: (deviceId: string) => void;
  onOpenMaintenance: (kiosk: Kiosk) => void;
}

export function KioskDetailModal({
  kiosk,
  isOpen,
  onClose,
  onUpdateUrl,
  onUpdateDetails,
  onSendRestart,
  onSendShutdown,
  onOpenMaintenance,
}: KioskDetailModalProps) {
  const [name, setName] = useState(kiosk?.name || '');
  const [deviceIdInput, setDeviceIdInput] = useState(kiosk?.deviceId || '');
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const [url, setUrl] = useState(kiosk?.kioskUrl || kiosk?.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [commands, setCommands] = useState<KioskCommand[]>([]);

  useEffect(() => {
    if (kiosk) {
      setName(kiosk.name || '');
      setDeviceIdInput(kiosk.deviceId || '');
      setUrl(kiosk.kioskUrl || kiosk.url || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
    }
  }, [kiosk]);

  useEffect(() => {
    if (isOpen && kiosk) {
      fetch(`/api/kiosks/commands?deviceId=${kiosk.deviceId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.commands) {
            setCommands(data.data.commands);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, kiosk]);

  if (!kiosk) return null;

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deviceIdInput.trim()) return;
    setIsUpdatingDetails(true);
    try {
      if (onUpdateDetails) {
        await onUpdateDetails(kiosk.deviceId, {
          name: name.trim(),
          newDeviceId: deviceIdInput.trim().toUpperCase(),
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
      await onUpdateUrl(kiosk.deviceId, url);
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              {kiosk.name}
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {kiosk.deviceId}
              </code>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Tablet Identity, Remote Actions & History
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 my-2 p-1 pr-2">
          {/* Telemetry Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Status</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span
                  className={`size-1.5 rounded-full ${
                    kiosk.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
                <span className={kiosk.status === 'online' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                  {kiosk.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </Card>

            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Location</span>
              <div className="mt-1 text-xs text-foreground truncate">
                {kiosk.location || 'Manila'}
              </div>
            </Card>

            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">OS</span>
              <div className="mt-1 text-xs text-foreground truncate">
                {kiosk.os || 'Windows 11'}
              </div>
            </Card>

            <Card className="p-3 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">Versions</span>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                Agent: {kiosk.agentVersion} / App: {kiosk.appVersion}
              </div>
            </Card>
          </div>

          {/* Device Identity & Information Edit Form */}
          <Card className="p-4 bg-muted/10">
            <form onSubmit={handleSaveDetails} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-foreground">
                  Edit Device Info
                </h4>
                {detailsSaved && (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-normal">
                    Saved
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Device Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Manila Store Kiosk 01"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Device ID</label>
                  <Input
                    type="text"
                    value={deviceIdInput}
                    onChange={(e) => setDeviceIdInput(e.target.value)}
                    placeholder="e.g. KIOSK-MNL-001"
                    className="font-mono uppercase"
                    required
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

          {/* Quick Remote Command Triggers */}
          <Card className="p-4 bg-muted/10">
            <h4 className="text-xs font-medium text-foreground mb-2">
              Remote Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendRestart(kiosk.deviceId)}
              >
                Restart Windows Tablet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendShutdown(kiosk.deviceId)}
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                Shutdown Tablet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenMaintenance(kiosk);
                }}
              >
                Set Maintenance Mode
              </Button>
            </div>
          </Card>

          {/* Central KioskUrl Configuration Section */}
          <Card className="p-4 bg-muted/10">
            <form onSubmit={handleSaveUrl} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-foreground">
                  Target URL (kioskUrl)
                </h4>
                {urlSaved && (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-normal">
                    Saved
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
                  href={`/api/kiosks/${kiosk.deviceId}/config`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  GET /config ↗
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Open Web App ↗
                </a>
              </div>
            </form>
          </Card>

          {/* Command History for this Device */}
          <Card className="p-4 bg-muted/10">
            <h4 className="text-xs font-medium text-foreground mb-2">
              Command History
            </h4>
            {commands.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 text-center">
                No recent commands recorded for this tablet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {commands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="flex items-center justify-between p-2 rounded bg-card border border-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-foreground">{cmd.type}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">ID: {cmd.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(cmd.createdAt).toLocaleTimeString()}
                      </span>
                      <Badge
                        variant="outline"
                        className={cmd.status === 'executed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-normal' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-normal'}
                      >
                        {cmd.status === 'executed' ? 'Executed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
