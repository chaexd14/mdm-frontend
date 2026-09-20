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

export interface EnrollDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll?: (data: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
    targetUrl?: string;
    kioskUrl?: string;
  }) => Promise<void>;
  onRegister?: (data: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
    kioskUrl?: string;
    targetUrl?: string;
  }) => Promise<void>;
}

export function EnrollDeviceModal({
  isOpen,
  onClose,
  onEnroll,
  onRegister,
}: EnrollDeviceModalProps) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('Manila');
  const [os, setOs] = useState('Android 14');
  const [agentVersion, setAgentVersion] = useState('1.0.0');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [targetUrl, setTargetUrl] = useState('https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim()) return;

    setIsSubmitting(true);
    try {
      const data = {
        deviceId: deviceId.trim().toUpperCase(),
        deviceName: deviceName.trim() || deviceId.trim(),
        location,
        os,
        agentVersion,
        appVersion,
        targetUrl: targetUrl.trim() || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli',
        kioskUrl: targetUrl.trim() || 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli',
      };

      if (onEnroll) {
        await onEnroll(data);
      } else if (onRegister) {
        await onRegister(data);
      }
      onClose();
    } catch (err) {
      console.error('Enrollment error:', err);
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
              Enroll New Android Device
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Enroll an Android device or terminal into the MDM fleet
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
                placeholder="e.g. KIOSK-AND-002"
                className="font-mono uppercase"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label className="text-xs text-foreground">
                Device Name
              </label>
              <Input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Front Desk Device 02"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs text-foreground">
                Managed Web App URL (Target Endpoint)
              </label>
              <Input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
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
                placeholder="e.g. Android 14"
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
                MDM App Version
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
            Once enrolled, the Android MDM app on the device will authenticate with this Device ID to send heartbeats and receive remote commands.
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
              {isSubmitting ? 'Enrolling...' : 'Enroll Device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const RegisterKioskModal = EnrollDeviceModal;
