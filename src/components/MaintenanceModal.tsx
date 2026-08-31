'use client';

import React, { useState, useEffect } from 'react';
import { Kiosk } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface MaintenanceModalProps {
  kiosk: Kiosk | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (deviceId: string, enabled: boolean, message?: string) => Promise<void>;
}

export function MaintenanceModal({
  kiosk,
  isOpen,
  onClose,
  onSave,
}: MaintenanceModalProps) {
  const [enabled, setEnabled] = useState(kiosk?.maintenanceMode ?? false);
  const [message, setMessage] = useState(
    kiosk?.maintenanceMessage || 'This kiosk is temporarily unavailable.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (kiosk) {
      setEnabled(kiosk.maintenanceMode);
      setMessage(kiosk.maintenanceMessage || 'This kiosk is temporarily unavailable.');
    }
  }, [kiosk]);

  if (!kiosk) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(kiosk.deviceId, enabled, enabled ? message : undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Maintenance Mode Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Target: <span className="font-mono">{kiosk.deviceId}</span> ({kiosk.name})
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Toggle Switch Card */}
          <Card className="p-3.5 bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Enable Maintenance Mode
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Block customer interactions and display maintenance banner
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked)}
            />
          </Card>

          {/* Custom Message input if enabled */}
          {enabled && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs text-foreground">
                Custom Maintenance Notice
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="e.g. This kiosk is temporarily unavailable. Please visit counter 2."
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Tablet will poll this notice on its next heartbeat or config check.
              </p>

              {/* Live Preview Box */}
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border text-center">
                <h4 className="text-xs font-medium text-foreground">
                  Under Maintenance
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {message || 'This kiosk is temporarily unavailable.'}
                </p>
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Updating...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
