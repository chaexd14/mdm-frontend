'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  X,
  Play,
  Square,
  Activity,
  CheckCircle2,
  Terminal,
  Send,
  RotateCcw,
  Radio,
  FileCheck,
} from 'lucide-react';
import { Kiosk } from '@/lib/types';

interface AgentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  kiosks: Kiosk[];
  onTriggerSync: () => void;
}

export function AgentSimulatorModal({
  isOpen,
  onClose,
  kiosks,
  onTriggerSync,
}: AgentSimulatorModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'heartbeat' | 'commands' | 'register'>('heartbeat');
  const [logs, setLogs] = useState<string[]>([]);
  const [isAutoHeartbeatActive, setIsAutoHeartbeatActive] = useState(false);
  const [pollIntervalSec, setPollIntervalSec] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set default selected deviceId
  useEffect(() => {
    if (kiosks.length > 0 && (!selectedDeviceId || !kiosks.some((k) => k.deviceId === selectedDeviceId))) {
      setSelectedDeviceId(kiosks[0].deviceId);
    }
  }, [kiosks, selectedDeviceId]);

  // Form states for register sandbox
  const [regDeviceId, setRegDeviceId] = useState('KIOSK-SIM-001');
  const [regDeviceName, setRegDeviceName] = useState('Simulator Tablet 001');
  const [regOs, setRegOs] = useState('Windows 11 Pro 24H2');
  const [regAgentVer, setRegAgentVer] = useState('1.0.0');
  const [regAppVer, setRegAppVer] = useState('1.0.0');
  const [regLocation, setRegLocation] = useState('Simulator Lab');
  const [regKioskUrl, setRegKioskUrl] = useState('https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli');

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // 1. Send Single Heartbeat
  const handleSendHeartbeat = async () => {
    if (!selectedDeviceId) return;
    try {
      addLog(`Sending POST /api/kiosks/heartbeat for ${selectedDeviceId}...`);
      const res = await fetch('/api/kiosks/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          agentVersion: '1.0.0',
          appVersion: '1.0.0',
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Heartbeat OK. Maintenance: ${data.data.maintenanceMode}, ServerTime: ${data.data.serverTime}`);
        onTriggerSync();
      } else {
        addLog(`Heartbeat failed: ${data.error}`);
      }
    } catch (err) {
      addLog(`Heartbeat network error: ${err}`);
    }
  };

  // 2. Fetch Kiosk Config (Source of truth for KioskUrl)
  const handleFetchConfig = async () => {
    if (!selectedDeviceId) return;
    try {
      addLog(`Fetching GET /api/kiosks/${selectedDeviceId}/config...`);
      const res = await fetch(`/api/kiosks/${selectedDeviceId}/config`);
      const data = await res.json();
      if (data.success) {
        addLog(`Config fetched successfully:`);
        addLog(`  -> deviceId: "${data.data.deviceId}"`);
        addLog(`  -> name: "${data.data.name}"`);
        addLog(`  -> kioskUrl: "${data.data.kioskUrl}"`);
        addLog(`  -> maintenanceMode: ${data.data.maintenanceMode}`);
        addLog(`  -> appVersion: "${data.data.appVersion}"`);
      } else {
        addLog(`Fetch config failed: ${data.error}`);
      }
    } catch (err) {
      addLog(`Fetch config network error: ${err}`);
    }
  };

  // 3. Poll pending commands & acknowledge
  const handlePollCommands = async () => {
    if (!selectedDeviceId) return;
    try {
      addLog(`Polling GET /api/kiosks/${selectedDeviceId}/commands...`);
      const res = await fetch(`/api/kiosks/${selectedDeviceId}/commands`);
      const data = await res.json();
      if (data.success) {
        const cmds = data.data.commands || [];
        if (cmds.length === 0) {
          addLog(`No pending commands waiting for ${selectedDeviceId}.`);
        } else {
          addLog(`Received ${cmds.length} pending command(s): ${JSON.stringify(cmds.map((c: any) => c.type))}`);
          // Auto execute & ACK each
          for (const cmd of cmds) {
            addLog(`Simulating C# agent executing command "${cmd.type}" (ID: ${cmd.id})...`);
            await new Promise((r) => setTimeout(r, 600));
            // Send ACK
            const ackRes = await fetch(`/api/kiosks/${selectedDeviceId}/commands/${cmd.id}/ack`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'executed' }),
            });
            const ackData = await ackRes.json();
            if (ackData.success) {
              addLog(`Command ${cmd.id} (${cmd.type}) acknowledged -> Status: Executed`);
            }

          }
          onTriggerSync();
        }
      }
    } catch (err) {
      addLog(`Poll commands error: ${err}`);
    }
  };

  // 4. Register New Tablet
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addLog(`Registering device POST /api/kiosks/register (${regDeviceId})...`);
      const res = await fetch('/api/kiosks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: regDeviceId,
          deviceName: regDeviceName,
          os: regOs,
          agentVersion: regAgentVer,
          appVersion: regAppVer,
          location: regLocation,
          kioskUrl: regKioskUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Successfully registered ${regDeviceId} with KioskUrl: ${data.data.kioskUrl}`);
        setSelectedDeviceId(regDeviceId);
        onTriggerSync();
      } else {
        addLog(`Registration failed: ${data.error}`);
      }
    } catch (err) {
      addLog(`Registration network error: ${err}`);
    }
  };

  // Toggle Auto-Heartbeat Loop
  useEffect(() => {
    if (isAutoHeartbeatActive) {
      addLog(`Started background heartbeat loop for ${selectedDeviceId} (every ${pollIntervalSec}s)`);
      handleSendHeartbeat();
      timerRef.current = setInterval(() => {
        handleSendHeartbeat();
        handlePollCommands();
      }, pollIntervalSec * 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoHeartbeatActive, selectedDeviceId, pollIntervalSec]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                C# Windows Kiosk Agent Simulator
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Interactive Sandbox
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Emulate C# agent background service heartbeats, config polling (`kioskUrl`), and command ACKs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Device Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 my-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Simulating Device:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
            >
              {kiosks.map((k) => (
                <option key={k.deviceId} value={k.deviceId}>
                  {k.deviceId} ({k.name}) - {k.status === 'online' ? 'Online' : 'Offline'}
                </option>
              ))}

            </select>
          </div>

          {/* Auto Loop Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoHeartbeatActive(!isAutoHeartbeatActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isAutoHeartbeatActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isAutoHeartbeatActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Auto-Loop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Auto-Loop (10s)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-4 gap-2">
          <button
            onClick={() => setActiveTab('heartbeat')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'heartbeat'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Heartbeat, Config & Polling
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Register Device
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'heartbeat' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={handleSendHeartbeat}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-300 text-xs font-bold transition-all active:scale-95"
                >
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>1. Send Heartbeat</span>
                </button>
                <button
                  onClick={handleFetchConfig}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-indigo-300 text-xs font-bold transition-all active:scale-95"
                >
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>2. Fetch GET /config (kioskUrl)</span>
                </button>
                <button
                  onClick={handlePollCommands}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-cyan-300 text-xs font-bold transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>3. Poll Commands & ACK</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Device ID</label>
                  <input
                    type="text"
                    value={regDeviceId}
                    onChange={(e) => setRegDeviceId(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Device Name</label>
                  <input
                    type="text"
                    value={regDeviceName}
                    onChange={(e) => setRegDeviceName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-medium text-slate-400">Target Web App URL (<code className="text-cyan-300 font-mono">kioskUrl</code>)</label>
                  <input
                    type="url"
                    value={regKioskUrl}
                    onChange={(e) => setRegKioskUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Operating System</label>
                  <input
                    type="text"
                    value={regOs}
                    onChange={(e) => setRegOs(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Location</label>
                  <input
                    type="text"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Agent Version</label>
                  <input
                    type="text"
                    value={regAgentVer}
                    onChange={(e) => setRegAgentVer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">App Version</label>
                  <input
                    type="text"
                    value={regAppVer}
                    onChange={(e) => setRegAppVer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/30 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Call POST /api/kiosks/register</span>
                </button>
              </div>
            </form>
          )}

          {/* Terminal Console Activity Output */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                C# Agent Console Logs
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear Log
              </button>
            </div>
            <div className="h-40 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] space-y-1 text-slate-300 shadow-inner">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">No agent activity yet. Trigger an action above.</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="leading-tight">
                    {l.includes('OK') || l.includes('Successfully') ? (
                      <span className="text-emerald-400">{l}</span>
                    ) : l.includes('error') || l.includes('failed') ? (
                      <span className="text-rose-400">{l}</span>
                    ) : (
                      <span className="text-slate-300">{l}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
          <span>Updates propagate instantly to the live dashboard.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
