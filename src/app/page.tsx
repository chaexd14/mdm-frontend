'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Plus,
  Radio,
  SlidersHorizontal,
  MapPin,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Zap,
} from 'lucide-react';
import { Kiosk, KioskCommand } from '@/lib/types';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { KioskCard } from '@/components/KioskCard';
import { KioskTableView } from '@/components/KioskTableView';
import { MaintenanceModal } from '@/components/MaintenanceModal';
import { CommandQueueModal } from '@/components/CommandQueueModal';
import { AgentSimulatorModal } from '@/components/AgentSimulatorModal';
import { KioskDetailModal } from '@/components/KioskDetailModal';
import { RegisterKioskModal } from '@/components/RegisterKioskModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';

export default function KioskDashboardPage() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5); // default 5s
  const [pendingCommandsCount, setPendingCommandsCount] = useState<number>(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [maintenanceKiosk, setMaintenanceKiosk] = useState<Kiosk | null>(null);
  const [detailKiosk, setDetailKiosk] = useState<Kiosk | null>(null);
  const [isCommandQueueOpen, setIsCommandQueueOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all kiosks
  const fetchKiosks = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/kiosks');
      const data = await res.json();
      if (data.success && data.data?.kiosks) {
        setKiosks(data.data.kiosks);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load kiosks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pending commands count
  const fetchCommandsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/kiosks/commands');
      const data = await res.json();
      if (data.success && data.data?.commands) {
        const pending = data.data.commands.filter((c: KioskCommand) => c.status === 'pending').length;
        setPendingCommandsCount(pending);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchKiosks(false);
    fetchCommandsCount();
  }, [fetchKiosks, fetchCommandsCount]);

  // Initial load
  useEffect(() => {
    fetchKiosks(true);
    fetchCommandsCount();
  }, [fetchKiosks, fetchCommandsCount]);

  // Auto refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(refreshAll, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshAll]);

  // Actions
  const handleSendRestart = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/kiosks/${deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'restart' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          'success',
          'Restart Command Queued',
          `Dispatched to ${deviceId}. The C# agent will execute shutdown.exe /r.`
        );
        refreshAll();
      } else {
        addToast('error', 'Failed to Queue Command', data.error);
      }
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
    }
  };

  const handleSendShutdown = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/kiosks/${deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'shutdown' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          'info',
          'Shutdown Command Queued',
          `Dispatched to ${deviceId}. The C# agent will execute shutdown.exe /s.`
        );
        refreshAll();
      } else {
        addToast('error', 'Failed to Queue Command', data.error);
      }
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
    }
  };

  const handleSaveMaintenance = async (deviceId: string, enabled: boolean, message?: string) => {
    try {
      const res = await fetch(`/api/kiosks/${deviceId}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, message }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          'success',
          enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
          `Kiosk ${deviceId} is now ${enabled ? 'displaying maintenance banner' : 'in active service'}.`
        );
        refreshAll();
      } else {
        addToast('error', 'Update Failed', data.error);
      }
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
    }
  };

  const handleUpdateUrl = async (deviceId: string, url: string) => {
    try {
      const res = await fetch(`/api/kiosks/${deviceId}/url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Kiosk URL Updated', `Tablet ${deviceId} set to load ${url}`);
        refreshAll();
      } else {
        addToast('error', 'Update URL Failed', data.error);
      }
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
    }
  };

  const handleUpdateKioskDetails = async (
    deviceId: string,
    updateData: { name?: string; newDeviceId?: string; location?: string; os?: string }
  ) => {
    try {
      const res = await fetch(`/api/kiosks/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success && data.data) {
        addToast(
          'success',
          'Kiosk Details Updated',
          `Tablet ${data.data.name} (${data.data.deviceId}) updated successfully.`
        );
        setDetailKiosk(data.data);
        refreshAll();
      } else {
        addToast('error', 'Update Failed', data.error || 'Failed to update kiosk details');
      }
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
    }
  };


  const handleRegisterKiosk = async (formData: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
  }) => {
    try {
      const res = await fetch('/api/kiosks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Tablet Enrolled Successfully', `${formData.deviceId} added to fleet.`);
        refreshAll();
      } else {
        addToast('error', 'Registration Failed', data.error);
      }
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
    }
  };

  const handleAckCommand = async (deviceId: string, commandId: string) => {
    try {
      const res = await fetch(`/api/kiosks/${deviceId}/commands/${commandId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'executed' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Command Acknowledged', `Command ${commandId} marked as executed.`);
        refreshAll();
      }

    } catch (err: any) {
      addToast('error', 'Ack Error', err.message);
    }
  };

  // Extract unique locations for filter
  const locations = ['all', ...Array.from(new Set(kiosks.map((k) => k.location || 'Manila')))];

  // Filtered kiosks
  const filteredKiosks = kiosks.filter((k) => {
    // Search query
    const matchSearch =
      !searchQuery ||
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.location && k.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.os && k.os.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    let matchStatus = true;
    if (selectedStatusFilter === 'online') matchStatus = k.status === 'online';
    if (selectedStatusFilter === 'offline') matchStatus = k.status === 'offline';
    if (selectedStatusFilter === 'maintenance') matchStatus = k.maintenanceMode;

    // Location filter
    let matchLocation = true;
    if (selectedLocation !== 'all') matchLocation = k.location === selectedLocation;

    return matchSearch && matchStatus && matchLocation;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-16">
      {/* Header Bar */}
      <Header
        onRefresh={() => fetchKiosks(true)}
        isLoading={isLoading}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenCommandQueue={() => setIsCommandQueueOpen(true)}
        pendingCommandsCount={pendingCommandsCount}
        lastUpdated={lastUpdated}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-4">
        {/* KPI Stats Overview */}
        <StatsOverview
          kiosks={kiosks}
          pendingCommandsCount={pendingCommandsCount}
          selectedFilter={selectedStatusFilter}
          onSelectFilter={setSelectedStatusFilter}
        />

        {/* Search, Location, Status Filters & View Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md mb-6">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tablet Name, Device ID, Location, OS..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">All Locations</option>
                {locations
                  .filter((l) => l !== 'all')
                  .map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
              </select>
            </div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tablet Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Header: Showing counts & quick clear filters */}
        <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              Fleet Tablets ({filteredKiosks.length})
            </span>
            {(searchQuery || selectedStatusFilter !== 'all' || selectedLocation !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('all');
                  setSelectedLocation('all');
                }}
                className="text-indigo-400 hover:underline font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Online threshold: &lt;90s heartbeat
          </span>
        </div>

        {/* Main Content Area: Grid View or Table View */}
        {filteredKiosks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center my-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <Monitor className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">No Kiosk Tablets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchQuery
                ? `No tablets matching "${searchQuery}". Try adjusting your search query or reset filters.`
                : 'No tablets currently registered in the database. Use the Add Tablet button to enroll your first device.'}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tablet</span>
              </button>
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
              >
                <span>Launch Simulator</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Tablet Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredKiosks.map((kiosk) => (
              <KioskCard
                key={kiosk.deviceId}
                kiosk={kiosk}
                onSendRestart={handleSendRestart}
                onSendShutdown={handleSendShutdown}
                onOpenMaintenance={setMaintenanceKiosk}
                onOpenDetail={setDetailKiosk}
              />
            ))}
          </div>
        ) : (
          /* Table List View */
          <KioskTableView
            kiosks={filteredKiosks}
            onSendRestart={handleSendRestart}
            onSendShutdown={handleSendShutdown}
            onOpenMaintenance={setMaintenanceKiosk}
            onOpenDetail={setDetailKiosk}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <MaintenanceModal
        kiosk={maintenanceKiosk}
        isOpen={Boolean(maintenanceKiosk)}
        onClose={() => setMaintenanceKiosk(null)}
        onSave={handleSaveMaintenance}
      />

      <KioskDetailModal
        kiosk={detailKiosk}
        isOpen={Boolean(detailKiosk)}
        onClose={() => setDetailKiosk(null)}
        onUpdateUrl={handleUpdateUrl}
        onUpdateDetails={handleUpdateKioskDetails}
        onSendRestart={handleSendRestart}
        onSendShutdown={handleSendShutdown}
        onOpenMaintenance={(k) => {
          setDetailKiosk(null);
          setMaintenanceKiosk(k);
        }}
      />

      <CommandQueueModal
        isOpen={isCommandQueueOpen}
        onClose={() => setIsCommandQueueOpen(false)}
        onAckCommand={handleAckCommand}
      />

      <AgentSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        kiosks={kiosks}
        onTriggerSync={refreshAll}
      />

      <RegisterKioskModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegisterKiosk}
      />

      {/* Live Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
