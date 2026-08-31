'use client';

import React, { useState } from 'react';
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
import { Card } from '@/components/ui/card';

interface RegisterKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
    kioskUrl?: string;
  }) => Promise<void>;
}

export function RegisterKioskModal({
  isOpen,
  onClose,
  onRegister,
}: RegisterKioskModalProps) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('Manila');
  const [os, setOs] = useState('Windows 11 Pro');
  const [agentVersion, setAgentVersion] = useState('1.0.0');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [kioskUrl, setKioskUrl] = useState('https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim()) return;

    setIsSubmitting(true);
    try {
      await onRegister({
        deviceId: deviceId.trim().toUpperCase(),
        deviceName: deviceName.trim() || deviceId.trim(),
        location,
        os,
        agentVersion,
        appVersion,
        kioskUrl: kioskUrl.trim() || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli',
      });
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Register New Kiosk Tablet
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Enroll a new physical tablet into the fleet
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label className="text-xs text-foreground">
                Device ID <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. KIOSK-MNL-002"
                className="font-mono uppercase"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label className="text-xs text-foreground">
                Tablet Name
              </label>
              <Input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Manila Store Kiosk 02"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs text-foreground">
                Target Web App URL (kioskUrl)
              </label>
              <Input
                type="url"
                value={kioskUrl}
                onChange={(e) => setKioskUrl(e.target.value)}
                placeholder="https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-foreground">
                Deployment Location
              </label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Manila"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-foreground">
                Operating System
              </label>
              <Input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="e.g. Windows 11 Pro"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-foreground">
                Agent Version
              </label>
              <Input
                type="text"
                value={agentVersion}
                onChange={(e) => setAgentVersion(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-foreground">
                Kiosk App Version
              </label>
              <Input
                type="text"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <Card className="p-2.5 bg-muted/20 text-[11px] text-muted-foreground">
            Once enrolled, the C# agent on the tablet will authenticate with this Device ID to send heartbeats and receive remote commands.
          </Card>

          {/* Action Buttons */}
          <DialogFooter className="pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register Device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
