'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  MapPin,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { Kiosk, KioskCommand } from '@/lib/types';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { KioskCard } from '@/components/KioskCard';
import { KioskTableView } from '@/components/KioskTableView';
import { MaintenanceModal } from '@/components/MaintenanceModal';
import { CommandQueueModal } from '@/components/CommandQueueModal';
import { KioskDetailModal } from '@/components/KioskDetailModal';
import { RegisterKioskModal } from '@/components/RegisterKioskModal';
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
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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
        toast.success('Restart Command Queued', {
          description: `Dispatched to ${deviceId}. C# agent will execute shutdown.exe /r.`,
        });
        refreshAll();
      } else {
        toast.error('Failed to Queue Command', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
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
        toast.info('Shutdown Command Queued', {
          description: `Dispatched to ${deviceId}. C# agent will execute shutdown.exe /s.`,
        });
        refreshAll();
      } else {
        toast.error('Failed to Queue Command', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
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
        toast.success(
          enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
          {
            description: `Kiosk ${deviceId} is now ${enabled ? 'displaying maintenance banner' : 'in active service'}.`,
          }
        );
        refreshAll();
      } else {
        toast.error('Update Failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
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
        toast.success('Kiosk URL Updated', {
          description: `Tablet ${deviceId} set to load ${url}`,
        });
        refreshAll();
      } else {
        toast.error('Update URL Failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
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
        toast.success('Kiosk Details Updated', {
          description: `Tablet ${data.data.name} (${data.data.deviceId}) updated successfully.`,
        });
        setDetailKiosk(data.data);
        refreshAll();
      } else {
        toast.error('Update Failed', {
          description: data.error || 'Failed to update kiosk details',
        });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  const handleRegisterKiosk = async (formData: {
    deviceId: string;
    deviceName: string;
    os: string;
    agentVersion: string;
    appVersion: string;
    location: string;
    kioskUrl?: string;
  }) => {
    try {
      const res = await fetch('/api/kiosks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Tablet Enrolled Successfully', {
          description: `${formData.deviceId} added to fleet.`,
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
      const res = await fetch(`/api/kiosks/${deviceId}/commands/${commandId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'executed' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Command Acknowledged', {
          description: `Command ${commandId} marked as executed.`,
        });
        refreshAll();
      }
    } catch (err: any) {
      toast.error('Ack Error', { description: err.message });
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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground pb-16">
      {/* Header Bar */}
      <Header
        onRefresh={() => fetchKiosks(true)}
        isLoading={isLoading}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
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
        <Card className="p-3 mb-6 bg-card border-border shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Tablet Name, Device ID, Location, OS..."
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
                  title="Tablet Card Grid View"
                >
                  <LayoutGrid className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="table"
                  className="h-7 w-7 p-0"
                  title="Table List View"
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
              Fleet Tablets ({filteredKiosks.length})
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
            Online threshold: &lt;90s heartbeat
          </span>
        </div>

        {/* Main Content Area: Grid View or Table View */}
        {filteredKiosks.length === 0 ? (
          <Card className="p-12 text-center my-6 bg-card/40 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">
                <Monitor className="size-6" />
              </div>
              <h3 className="text-sm font-medium text-foreground">No Kiosk Tablets Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {searchQuery
                  ? `No tablets matching "${searchQuery}". Try adjusting your search query or reset filters.`
                  : 'No tablets currently registered in the database. Use the Add Tablet button to enroll your first device.'}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => setIsRegisterOpen(true)}
                >
                  Add Tablet
                </Button>
              </div>
            </CardContent>
          </Card>
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

      <RegisterKioskModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegisterKiosk}
      />
    </div>
  );
}
