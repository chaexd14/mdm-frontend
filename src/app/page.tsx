'use client';

import { mergeSnapshot, mergeEvents, type DeviceEvent, type Tombstone } from '@/lib/reconciliation';
import { apiFetch, subscribeEvents } from '@/lib/api';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { Device } from '@/lib/types';
import { AppReleasesPanel } from '@/components/AppReleasesPanel';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { DeviceCard } from '@/components/DeviceCard';
import { DeviceTableView } from '@/components/DeviceTableView';
import { MaintenanceModal } from '@/components/MaintenanceModal';
import { CommandQueueModal } from '@/components/CommandQueueModal';
import { DeviceDetailModal } from '@/components/DeviceDetailModal';
import { EnrollDeviceModal } from '@/components/EnrollDeviceModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DeviceDashboardPage() {
  const [releasesOpen, setReleasesOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(60); // Periodic reconciliation; SSE supplies immediate updates
  const [pendingCommandsCount, setPendingCommandsCount] = useState<number>(0);

  const [syncError, setSyncError] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [enrollment, setEnrollment] = useState<{ code: string; expiresAt: string; deviceId: string } | null>(null);
  const devicesRevision = useRef(0);
  const deletedAt = useRef(new Map<string, Tombstone>());
  const changedAt = useRef(new Map<string, number>());
  const [fleetPage, setFleetPage] = useState(1);
  const knownDevices = useRef(new Map<string, string>());
  useEffect(() => { knownDevices.current = new Map(devices.map(device => [device.deviceId, device.id])); }, [devices]);
  const devicesFetchInFlight = useRef(false);
  const lastSnapshotRepair = useRef(0);
  const devicesRequest = useRef(0);
  const countRequest = useRef(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [maintenanceDevice, setMaintenanceDevice] = useState<Device | null>(null);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [isCommandQueueOpen, setIsCommandQueueOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  // Fetch all devices
  const fetchDevices = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    if (devicesFetchInFlight.current) return;
    devicesFetchInFlight.current = true;
    const request = ++devicesRequest.current;
    const revision = devicesRevision.current;
    if (showLoading) setIsLoading(true);
    try {
      let res = await apiFetch('/api/devices');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Device list refresh failed');
      if (data.data?.devices || data.data?.kiosks) {
        setSyncError(null);
        if (request !== devicesRequest.current) return;
        setDevices(previous => mergeSnapshot(previous, data.data.devices || data.data.kiosks, changedAt.current, revision, deletedAt.current));
        setLastUpdated(new Date());
      }
    } catch (err) {
      setSyncError('The device list could not be refreshed. Live updates may be incomplete.');
      console.error('Failed to load devices:', err);
    } finally {
      devicesFetchInFlight.current = false;
      setIsLoading(false);
    }
  }, []);

  // Fetch pending commands count
  const fetchCommandsCount = useCallback(async () => {
    const request = ++countRequest.current;
    try {
      let res = await apiFetch('/api/devices/commands/summary');
      const data = await res.json();
      if (data.success && typeof data.data?.pendingCount === 'number') {
        if (request === countRequest.current) setPendingCommandsCount(data.data.pendingCount ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchDevices(false);
    fetchCommandsCount();
  }, [fetchDevices, fetchCommandsCount]);

  // Initial load
  useEffect(() => {
    fetchDevices(true);
    fetchCommandsCount();
  }, [fetchDevices, fetchCommandsCount]);

  // Real-time Server-Sent Events (SSE) Stream for Instant Sub-second In-Memory Reactivity
  useEffect(() => {
    const pending = new Map<string, DeviceEvent>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let commandsChanged = false;
    let needsSnapshot = false;
    const flush = () => {
      timer = null;
      if (pending.size) { const batch = [...pending.values()]; pending.clear(); setDevices(previous => mergeEvents(previous, batch)); setLastUpdated(new Date()); }
      if (needsSnapshot) { needsSnapshot = false; if (Date.now() - lastSnapshotRepair.current >= 5000) { lastSnapshotRepair.current = Date.now(); refreshAll(); } }
      if (commandsChanged) { commandsChanged = false; fetchCommandsCount(); }
    };
    const stream = subscribeEvents((type, raw) => {
      try {
        const data = JSON.parse(raw);
        if (type === 'connected') refreshAll();
        if ((type === 'device_updated' || type === 'device_telemetry') && data.device?.deviceId) {
          const id: string = data.device.deviceId;
          if (type === 'device_telemetry' && (!knownDevices.current.has(id) || (data.device.id && knownDevices.current.get(id) !== data.device.id))) needsSnapshot = true;
          if (type === 'device_updated') deletedAt.current.delete(id);
          changedAt.current.set(id, ++devicesRevision.current);
          const queued = pending.get(id);
          if (!queued?.device || (data.device.revision ?? 0) >= (queued.device.revision ?? 0)) {
            pending.set(id, { deviceId: id, device: { ...queued?.device, ...data.device }, partial: type === 'device_telemetry' && queued?.partial !== false });
          }
          // A telemetry patch cannot construct a full device; snapshots repair unknown IDs.
        }
        if (type === 'device_deleted' && data.deviceId) {
          changedAt.current.set(data.deviceId, ++devicesRevision.current);
          deletedAt.current.set(data.deviceId, { sequence: devicesRevision.current, id: data.id });
          pending.set(data.deviceId, { deviceId: data.deviceId, deletedId: data.id });
        }
        if (type === 'command_created' || type === 'command_updated') commandsChanged = true;
        if (!timer && (pending.size || commandsChanged)) timer = setTimeout(flush, 100);
      } catch { /* Periodic snapshots reconcile missed or invalid events. */ }
    }, setStreamConnected);
    return () => { stream.close(); if (timer) clearTimeout(timer); };
  }, [fetchCommandsCount, refreshAll]);

  // Auto refresh fallback timer
  useEffect(() => {
    if (autoRefreshInterval <= 0 && streamConnected) return;
    const interval = setInterval(refreshAll, (streamConnected ? Math.max(60, autoRefreshInterval) : Math.max(5, Math.min(10, autoRefreshInterval))) * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshAll, streamConnected]);

  // Recompute presence even if a disconnected device emits no more events.
  useEffect(() => {
    const timer = setInterval(() => setDevices(previous => previous.map(device => {
      const age = Date.now() - Date.parse(device.lastSeen);
      const status = age < 120000 ? 'online' : 'offline';
      const connectionQuality = !device.lastSeen || age >= 120000 ? 'offline' : age >= 60000 ? 'stale' : 'healthy';
      return device.status === status && device.connectionQuality === connectionQuality ? device : { ...device, status, connectionQuality };
    })), 10000);
    return () => clearInterval(timer);
  }, []);

  const createEnrollment = async (deviceId: string) => {
    const res = await apiFetch('/api/devices/' + encodeURIComponent(deviceId) + '/enrollment', { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not issue enrollment code');
    setEnrollment({ code: data.data.enrollmentCode, expiresAt: data.data.expiresAt, deviceId });
  };

  // Android MDM Actions
  const handleReloadApp = useCallback(async (deviceId: string) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reload' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Reload Command Queued', {
          description: `Dispatched to ${deviceId}. The Android MDM device will reload the managed web app.`,
        });
        refreshAll();
      } else {
        toast.error('Failed to Queue Command', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  }, [refreshAll]);

  const handleLockDevice = useCallback(async (deviceId: string) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lock_kiosk' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Lock Device Command Queued', {
          description: `Dispatched to ${deviceId}. Device will engage Lock Task Mode.`,
        });
        refreshAll();
      } else {
        toast.error('Failed to Queue Command', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  }, [refreshAll]);

  const handleUnlockDevice = useCallback(async (deviceId: string) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unlock_kiosk' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info('Unlock Device Command Queued', {
          description: `Dispatched to ${deviceId}. Device will release Lock Task Mode to allow launcher access.`,
        });
        refreshAll();
      } else {
        toast.error('Failed to Queue Command', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  }, [refreshAll]);

  const handleSendRestart = useCallback(async (deviceId: string) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'restart' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Restart Command Queued', {
          description: `Dispatched to ${deviceId}. Device will restart application.`,
        });
        refreshAll();
      } else {
        toast.error('Failed to Queue Command', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  }, [refreshAll]);

  const handleSaveMaintenance = async (deviceId: string, enabled: boolean, message?: string) => {
    try {
      const res = await apiFetch('/api/devices/' + encodeURIComponent(deviceId) + '/maintenance', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Configuration update failed');
      toast.success('Maintenance configuration saved', { description: 'Waiting for device confirmation.' });
      refreshAll();
    } catch (error) {
      toast.error('Configuration update failed', { description: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const handleUpdateUrl = async (deviceId: string, url: string) => {
    try {
      const res = await apiFetch('/api/devices/' + encodeURIComponent(deviceId) + '/url', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUrl: url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'URL update failed');
      toast.success('URL configuration saved', { description: 'Waiting for device confirmation.' });
      refreshAll();
    } catch (error) {
      toast.error('URL update failed', { description: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const handleUpdateDeviceDetails = async (
    deviceId: string,
    updateData: { name?: string; newDeviceId?: string; location?: string; os?: string }
  ) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success('Device Details Updated', {
          description: `Device ${data.data.name} (${data.data.deviceId}) updated successfully.`,
        });
        setDetailDevice(data.data);
        refreshAll();
      } else {
        toast.error('Update Failed', {
          description: data.error || 'Failed to update device details',
        });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  const handleEnrollDevice = async (formData: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
    targetUrl?: string;
  }) => {
    try {
      const res = await apiFetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        await createEnrollment(formData.deviceId);
        toast.success('Device Registered Successfully', {
          description: `${formData.deviceId} added to MDM fleet.`,
        });
        refreshAll();
      } else {
        toast.error('Registration Failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  const handleAckCommand = async (deviceId: string, commandId: string) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}/commands/${encodeURIComponent(commandId)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Command Cancelled', {
          description: `Command ${encodeURIComponent(commandId)} cancelled before delivery.`,
        });
        refreshAll();
      } else { toast.error('Cancellation failed', { description: data.error }); }
    } catch (err: any) {
      toast.error('Cancellation failed', { description: err.message });
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const res = await apiFetch(`/api/devices/${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Device Removed', {
          description: `Device ${deviceId} was removed from the fleet.`,
        });
        setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
        setDetailDevice(null);
        refreshAll();
      } else {
        toast.error('Failed to Remove Device', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  // Extract unique locations for filter
  const locations = ['all', ...Array.from(new Set(devices.map((k) => k.location || 'Manila')))];

  // Filtered devices
  const filteredDevices = useMemo(() => devices.filter((k) => {
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
  }), [devices, searchQuery, selectedStatusFilter, selectedLocation]);
  const pageCount = Math.max(1, Math.ceil(filteredDevices.length / 48));
  const activePage = Math.min(fleetPage, pageCount);
  const visibleDevices = filteredDevices.slice((activePage - 1) * 48, activePage * 48);
  useEffect(() => { setFleetPage(1); }, [searchQuery, selectedStatusFilter, selectedLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground pb-16">
      {syncError && <p role="alert" className="px-6 py-3 text-sm text-destructive">{syncError}</p>}
      <div className="px-6 pt-3 flex justify-end"><Button variant="outline" onClick={() => setReleasesOpen(true)}>App software updates</Button></div>
      {/* Header Bar */}
      <Header
        onRefresh={() => fetchDevices(true)}
        isLoading={isLoading}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        onOpenEnroll={() => setIsEnrollOpen(true)}
        onOpenRegister={() => setIsEnrollOpen(true)}
        onOpenCommandQueue={() => setIsCommandQueueOpen(true)}
        pendingCommandsCount={pendingCommandsCount}
        lastUpdated={lastUpdated}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-4">
        {/* KPI Stats Overview */}
        <StatsOverview
          devices={devices}
          kiosks={devices}
          pendingCommandsCount={pendingCommandsCount}
          selectedFilter={selectedStatusFilter}
          onSelectFilter={setSelectedStatusFilter}
        />

        {/* Search, Location, Status Filters & View Controls Bar */}
        <Card className="p-3 mb-6 bg-card border-border shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Device Name, Device ID, Location, OS..."
                className="pl-9 pr-14 text-xs h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground h-6 px-1.5"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Location & View Mode Filters */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedLocation}
                onValueChange={(val) => val && setSelectedLocation(val)}
              >
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations
                    .filter((l) => l !== 'all')
                    .map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle (Grid vs Table) */}
              <ToggleGroup
                value={[viewMode]}
                onValueChange={(val) => {
                  if (val && val.length > 0) setViewMode(val[0] as 'grid' | 'table');
                }}
                variant="outline"
                size="sm"
                className="h-9 p-0.5 bg-background border border-input rounded-lg"
              >
                <ToggleGroupItem
                  value="grid"
                  className="h-7 w-7 p-0"
                  title="Device Card Grid View"
                >
                  <LayoutGrid className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="table"
                  className="h-7 w-7 p-0"
                  title="Device Table View"
                >
                  <List className="size-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </Card>

        {/* Section Header: Showing counts & quick clear filters */}
        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              Fleet Devices ({filteredDevices.length})
            </span>
            {(searchQuery || selectedStatusFilter !== 'all' || selectedLocation !== 'all') && (
              <Button
                variant="link"
                size="xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('all');
                  setSelectedLocation('all');
                }}
                className="text-primary hover:underline p-0 h-auto text-xs"
              >
                Reset Filters
              </Button>
            )}
          </div>

          <span className="text-[11px] text-muted-foreground">
            {streamConnected ? 'Live updates connected' : 'Reconnecting live updates'} · Offline after 2m without telemetry
          </span>
        </div>

        {enrollment && <div role="status" className="border rounded p-4 my-4 space-y-2">
          <p>Enrollment code for {enrollment.deviceId}. Enter it in the device admin screen before {new Date(enrollment.expiresAt).toLocaleTimeString()}.</p>
          <code className="break-all select-all">{enrollment.code}</code>
          <button className="ml-4 underline" onClick={() => setEnrollment(null)}>Dismiss</button>
        </div>}
        {/* Main Content Area: Grid View or Table View */}
        {filteredDevices.length === 0 ? (
          <Card className="p-12 text-center my-6 bg-card/40 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">
                <Monitor className="size-6" />
              </div>
              <h3 className="text-sm font-medium text-foreground">No MDM Devices Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {searchQuery
                  ? `No devices matching "${searchQuery}". Try adjusting your search query or reset filters.`
                  : 'No devices currently enrolled in the database. Use the Enroll Device button to add your first terminal.'}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => setIsEnrollOpen(true)}
                >
                  Enroll Device
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Device Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleDevices.map((device) => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                onSendReload={handleReloadApp}
                onSendLockDevice={handleLockDevice}
                onSendUnlockDevice={handleUnlockDevice}
                onSendRestart={handleSendRestart}
                onOpenMaintenance={setMaintenanceDevice}
                onOpenDetail={setDetailDevice}
              />
            ))}
          </div>
        ) : (
          /* Table List View */
          <DeviceTableView
            devices={visibleDevices}
            onSendReload={handleReloadApp}
            onSendLockDevice={handleLockDevice}
            onSendUnlockDevice={handleUnlockDevice}
            onSendRestart={handleSendRestart}
            onOpenMaintenance={setMaintenanceDevice}
            onOpenDetail={setDetailDevice}
          />
        )}
        {pageCount > 1 && <nav aria-label="Fleet pages" className="flex justify-center items-center gap-4 py-6">
          <Button variant="outline" disabled={activePage <= 1} onClick={() => setFleetPage(activePage - 1)}>Previous</Button>
          <span>{activePage} / {pageCount} · up to 48 devices per page</span>
          <Button variant="outline" disabled={activePage >= pageCount} onClick={() => setFleetPage(activePage + 1)}>Next</Button>
        </nav>}
      </main>

      <AppReleasesPanel open={releasesOpen} onClose={() => setReleasesOpen(false)} devices={devices} />
      {/* Modals & Drawers */}
      <MaintenanceModal
        device={maintenanceDevice}
        isOpen={Boolean(maintenanceDevice)}
        onClose={() => setMaintenanceDevice(null)}
        onSave={handleSaveMaintenance}
      />

      <DeviceDetailModal
        device={devices.find(device => device.deviceId === detailDevice?.deviceId) || detailDevice}
        isOpen={Boolean(detailDevice)}
        onClose={() => setDetailDevice(null)}
        onUpdateUrl={handleUpdateUrl}
        onUpdateDetails={handleUpdateDeviceDetails}
        onSendReload={handleReloadApp}
        onSendLockDevice={handleLockDevice}
        onSendUnlockDevice={handleUnlockDevice}
        onSendRestart={handleSendRestart}
        onOpenMaintenance={(d) => {
          setDetailDevice(null);
          setMaintenanceDevice(d);
        }}
        onDeleteDevice={handleDeleteDevice}
        onIssueEnrollment={async deviceId => { await createEnrollment(deviceId); setDetailDevice(null); }}
      />

      <CommandQueueModal
        isOpen={isCommandQueueOpen}
        onClose={() => setIsCommandQueueOpen(false)}
        onAckCommand={handleAckCommand}
      />

      <EnrollDeviceModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        onEnroll={handleEnrollDevice}
      />
    </div>
  );
}
