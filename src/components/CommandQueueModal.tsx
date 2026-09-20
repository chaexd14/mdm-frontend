'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { DeviceCommand, KioskCommand } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card } from '@/components/ui/card';

interface CommandQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAckCommand?: (deviceId: string, commandId: string) => Promise<void>;
}

export function CommandQueueModal({
  isOpen,
  onClose,
  onAckCommand,
}: CommandQueueModalProps) {
  const [commands, setCommands] = useState<DeviceCommand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed'>('all');

  const fetchCommands = async () => {
    setIsLoading(true);
    try {
      let res = await fetch('/api/devices/commands');
      if (!res.ok) {
        res = await fetch('/api/kiosks/commands');
      }
      const data = await res.json();
      if (data.success && data.data?.commands) {
        setCommands(data.data.commands);
      }
    } catch (err) {
      console.error('Failed to load commands:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCommands();
      const interval = setInterval(fetchCommands, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const filteredCommands = commands.filter((c) => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'executed') return c.status === 'executed';
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Remote Commands & Queue
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Track pending and executed Android MDM device commands
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={fetchCommands}
              className="mr-6"
              title="Refresh commands list"
            >
              <RefreshCw className={isLoading ? 'animate-spin size-3.5' : 'size-3.5'} />
            </Button>
          </div>
        </DialogHeader>

        {/* Filter Pills with ToggleGroup */}
        <div className="py-2">
          <ToggleGroup
            value={[filter]}
            onValueChange={(val) => {
              if (val && val.length > 0) setFilter(val[0] as 'all' | 'pending' | 'executed');
            }}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            {(['all', 'pending', 'executed'] as const).map((mode) => (
              <ToggleGroupItem
                key={mode}
                value={mode}
                className="capitalize text-xs px-2.5"
              >
                {mode} ({mode === 'all' ? commands.length : commands.filter((c) => c.status === mode).length})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto space-y-2 p-1 pr-2 my-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No {filter !== 'all' ? filter : ''} commands found in history.
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <Card
                key={cmd.id}
                className="p-3 bg-muted/20 hover:bg-muted/30 transition-all flex flex-row items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground uppercase">
                      {cmd.type}
                    </span>
                    <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {cmd.deviceId}
                    </code>
                  </div>

                  {cmd.payload && Object.keys(cmd.payload).length > 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground truncate max-w-xs mt-0.5">
                      {JSON.stringify(cmd.payload)}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                    <span>ID: {cmd.id}</span>
                    <span>•</span>
                    <span>{new Date(cmd.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cmd.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-xs font-normal"
                      >
                        Pending
                      </Badge>
                      {onAckCommand && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onAckCommand(cmd.deviceId, cmd.id)}
                          className="text-[11px]"
                          title="Simulate agent acknowledging execution"
                        >
                          Ack
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs font-normal"
                    >
                      Executed
                    </Badge>
                  )}
                </div>
              </Card>
            ))
          )}
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
