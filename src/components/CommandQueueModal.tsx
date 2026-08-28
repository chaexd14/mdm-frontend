'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Power,
  Sliders,
} from 'lucide-react';
import { KioskCommand } from '@/lib/types';

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
  const [commands, setCommands] = useState<KioskCommand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed'>('all');

  const fetchCommands = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kiosks/commands');
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

  if (!isOpen) return null;

  const filteredCommands = commands.filter((c) => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'executed') return c.status === 'executed';
    return true;
  });

  const getCommandIcon = (type: string) => {
    if (type === 'restart') return <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />;
    if (type === 'shutdown') return <Power className="w-3.5 h-3.5 text-rose-400" />;
    return <Sliders className="w-3.5 h-3.5 text-cyan-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Remote Commands & Queue
              </h3>
              <p className="text-xs text-slate-400">
                Track pending and executed Windows agent commands
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCommands}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh commands list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 py-3">
          {(['all', 'pending', 'executed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {mode} ({mode === 'all' ? commands.length : commands.filter((c) => c.status === mode).length})
            </button>
          ))}
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No {filter !== 'all' ? filter : ''} commands found in history.
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getCommandIcon(cmd.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white capitalize">
                        {cmd.type}
                      </span>
                      <code className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {cmd.deviceId}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>ID: {cmd.id}</span>
                      <span>•</span>
                      <span>{new Date(cmd.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {cmd.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                      {onAckCommand && (
                        <button
                          onClick={() => onAckCommand(cmd.deviceId, cmd.id)}
                          className="px-2 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-medium"
                          title="Simulate agent acknowledging execution"
                        >
                          Simulate Ack
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Executed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
