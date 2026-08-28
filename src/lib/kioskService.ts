import { supabase } from './supabase';
import { Kiosk, KioskCommand, KioskConfigData, KioskStatus } from './types';

export const DEFAULT_KIOSK_URL = 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli';

// Helper to compute status based on 90s threshold
export function computeKioskStatus(lastSeenStr?: string | null): KioskStatus {
  if (!lastSeenStr) return 'offline';
  try {
    const lastSeenTime = new Date(lastSeenStr).getTime();
    const now = Date.now();
    return (now - lastSeenTime) < 90 * 1000 ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

// Convert DB snake_case record to CamelCase Kiosk object
export function mapDbKioskToModel(dbRecord: Record<string, unknown>): Kiosk {
  const lastSeen = (dbRecord.last_seen as string) || new Date().toISOString();
  const url = (dbRecord.kiosk_url as string) || (dbRecord.url as string) || DEFAULT_KIOSK_URL;
  return {
    id: (dbRecord.id as string) || '',
    deviceId: (dbRecord.device_id as string) || '',
    name: (dbRecord.name as string) || (dbRecord.device_id as string) || 'Kiosk Tablet',
    location: (dbRecord.location as string) || 'Manila',
    os: (dbRecord.os as string) || 'Windows 11 Pro',
    agentVersion: (dbRecord.agent_version as string) || '1.0.0',
    appVersion: (dbRecord.app_version as string) || '1.0.0',
    lastSeen: lastSeen,
    maintenanceMode: Boolean(dbRecord.maintenance_mode),
    maintenanceMessage: (dbRecord.maintenance_message as string) || null,
    url: url,
    kioskUrl: url,
    refreshInterval: Number(dbRecord.refresh_interval) || 30,
    allowTransactions: dbRecord.allow_transactions !== undefined ? Boolean(dbRecord.allow_transactions) : true,
    theme: (dbRecord.theme as string) || 'default',
    status: computeKioskStatus(lastSeen),
    createdAt: (dbRecord.created_at as string) || undefined,
    updatedAt: (dbRecord.updated_at as string) || undefined,
  };
}

// In-memory fallback cache (starts clean without hardcoded data)
const memoryKiosks: Map<string, Kiosk> = new Map();
const memoryCommands: Map<string, KioskCommand> = new Map();

export const kioskService = {
  // 1. Get all kiosks
  async getAllKiosks(): Promise<Kiosk[]> {
    try {
      const { data, error } = await supabase
        .from('kiosks')
        .select('*')
        .order('device_id', { ascending: true });

      if (error || !data) {
        return Array.from(memoryKiosks.values()).map((k) => ({
          ...k,
          status: computeKioskStatus(k.lastSeen),
        }));
      }

      const kiosks = data.map(mapDbKioskToModel);
      // Sync memory
      memoryKiosks.clear();
      kiosks.forEach((k) => memoryKiosks.set(k.deviceId, k));
      return kiosks;
    } catch {
      return Array.from(memoryKiosks.values()).map((k) => ({
        ...k,
        status: computeKioskStatus(k.lastSeen),
      }));
    }
  },

  // 2. Get single kiosk by deviceId
  async getKioskByDeviceId(deviceId: string): Promise<Kiosk | null> {
    try {
      const { data, error } = await supabase
        .from('kiosks')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (error || !data) {
        const mem = memoryKiosks.get(deviceId);
        if (mem) {
          return { ...mem, status: computeKioskStatus(mem.lastSeen) };
        }
        return null;
      }

      const kiosk = mapDbKioskToModel(data);
      memoryKiosks.set(kiosk.deviceId, kiosk);
      return kiosk;
    } catch {
      const mem = memoryKiosks.get(deviceId);
      return mem ? { ...mem, status: computeKioskStatus(mem.lastSeen) } : null;
    }
  },

  // 3. Register or update device
  async registerKiosk(payload: {
    deviceId: string;
    deviceName?: string;
    name?: string;
    os?: string;
    agentVersion?: string;
    appVersion?: string;
    location?: string;
    url?: string;
    kioskUrl?: string;
  }): Promise<{ deviceId: string; registered: boolean; kioskUrl: string }> {
    const { deviceId, deviceName, name, os, agentVersion, appVersion, location, url, kioskUrl } = payload;
    const resolvedName = deviceName || name || deviceId;
    const resolvedUrl = kioskUrl || url || DEFAULT_KIOSK_URL;
    const now = new Date().toISOString();

    try {
      const { data: existing } = await supabase
        .from('kiosks')
        .select('id, url, kiosk_url')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (existing) {
        const updateData: Record<string, unknown> = {
          name: resolvedName,
          os: os || 'Windows 11 Pro',
          agent_version: agentVersion || '1.0.0',
          app_version: appVersion || '1.0.0',
          location: location || 'Manila',
          last_seen: now,
          updated_at: now,
        };
        if (kioskUrl || url) {
          updateData.url = resolvedUrl;
        }

        await supabase
          .from('kiosks')
          .update(updateData)
          .eq('device_id', deviceId);
      } else {
        await supabase.from('kiosks').insert({
          device_id: deviceId,
          name: resolvedName,
          os: os || 'Windows 11 Pro',
          agent_version: agentVersion || '1.0.0',
          app_version: appVersion || '1.0.0',
          location: location || 'Manila',
          last_seen: now,
          maintenance_mode: false,
          url: resolvedUrl,
          refresh_interval: 30,
          allow_transactions: true,
          theme: 'default',
        });
      }
    } catch (err) {
      console.warn('Supabase register error:', err);
    }

    // Memory cache update
    const existingMem = memoryKiosks.get(deviceId);
    const finalUrl = (kioskUrl || url) ? resolvedUrl : (existingMem?.kioskUrl || existingMem?.url || resolvedUrl);
    memoryKiosks.set(deviceId, {
      id: existingMem?.id || `kiosk_${Date.now()}`,
      deviceId,
      name: resolvedName,
      location: location || existingMem?.location || 'Manila',
      os: os || existingMem?.os || 'Windows 11 Pro',
      agentVersion: agentVersion || existingMem?.agentVersion || '1.0.0',
      appVersion: appVersion || existingMem?.appVersion || '1.0.0',
      lastSeen: now,
      maintenanceMode: existingMem?.maintenanceMode || false,
      maintenanceMessage: existingMem?.maintenanceMessage || null,
      url: finalUrl,
      kioskUrl: finalUrl,
      refreshInterval: existingMem?.refreshInterval || 30,
      allowTransactions: existingMem?.allowTransactions !== undefined ? existingMem.allowTransactions : true,
      theme: existingMem?.theme || 'default',
      status: 'online',
    });

    return { deviceId, registered: true, kioskUrl: finalUrl };
  },

  // 4. Heartbeat
  async heartbeat(payload: {
    deviceId: string;
    agentVersion?: string;
    appVersion?: string;
    timestamp?: string;
  }): Promise<{ deviceId: string; maintenanceMode: boolean; serverTime: string; kioskUrl?: string }> {
    const { deviceId, agentVersion, appVersion } = payload;
    const now = new Date().toISOString();
    let maintenanceMode = false;
    let currentKioskUrl = DEFAULT_KIOSK_URL;

    try {
      const { data: existing } = await supabase
        .from('kiosks')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (existing) {
        maintenanceMode = Boolean(existing.maintenance_mode);
        currentKioskUrl = existing.kiosk_url || existing.url || DEFAULT_KIOSK_URL;
        const updateData: Record<string, unknown> = {
          last_seen: now,
          updated_at: now,
        };
        if (agentVersion) updateData.agent_version = agentVersion;
        if (appVersion) updateData.app_version = appVersion;

        await supabase
          .from('kiosks')
          .update(updateData)
          .eq('device_id', deviceId);
      } else {
        // Auto-register if not yet exists with default central KioskUrl
        await supabase.from('kiosks').insert({
          device_id: deviceId,
          name: deviceId,
          os: 'Windows 11 Pro',
          agent_version: agentVersion || '1.0.0',
          app_version: appVersion || '1.0.0',
          last_seen: now,
          maintenance_mode: false,
          url: DEFAULT_KIOSK_URL,
        });
      }
    } catch (err) {
      console.warn('Supabase heartbeat error:', err);
    }

    // Memory cache update
    const mem = memoryKiosks.get(deviceId);
    if (mem) {
      maintenanceMode = mem.maintenanceMode;
      currentKioskUrl = mem.kioskUrl || mem.url || DEFAULT_KIOSK_URL;
      mem.lastSeen = now;
      if (agentVersion) mem.agentVersion = agentVersion;
      if (appVersion) mem.appVersion = appVersion;
      mem.status = 'online';
    } else {
      memoryKiosks.set(deviceId, {
        id: `kiosk_${Date.now()}`,
        deviceId,
        name: deviceId,
        location: 'Manila',
        os: 'Windows 11 Pro',
        agentVersion: agentVersion || '1.0.0',
        appVersion: appVersion || '1.0.0',
        lastSeen: now,
        maintenanceMode: false,
        maintenanceMessage: null,
        url: DEFAULT_KIOSK_URL,
        kioskUrl: DEFAULT_KIOSK_URL,
        refreshInterval: 30,
        allowTransactions: true,
        theme: 'default',
        status: 'online',
      });
    }

    return {
      deviceId,
      maintenanceMode,
      serverTime: now,
      kioskUrl: currentKioskUrl,
    };
  },

  // 5. Get pending commands for device
  async getPendingCommands(deviceId: string): Promise<Array<{ id: string; type: string; createdAt: string }>> {
    try {
      const { data, error } = await supabase
        .from('kiosk_commands')
        .select('id, type, created_at')
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error || !data) {
        return Array.from(memoryCommands.values())
          .filter((c) => c.deviceId === deviceId && c.status === 'pending')
          .map((c) => ({ id: c.id, type: c.type, createdAt: c.createdAt }));
      }

      return data.map((d) => ({
        id: d.id,
        type: d.type,
        createdAt: d.created_at,
      }));
    } catch {
      return Array.from(memoryCommands.values())
        .filter((c) => c.deviceId === deviceId && c.status === 'pending')
        .map((c) => ({ id: c.id, type: c.type, createdAt: c.createdAt }));
    }
  },

  // 6. Create command for device
  async createCommand(
    deviceId: string,
    type: string,
    payload?: Record<string, unknown>
  ): Promise<{ commandId: string; deviceId: string; type: string; status: string }> {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    try {
      const { data: kiosk } = await supabase
        .from('kiosks')
        .select('id')
        .eq('device_id', deviceId)
        .maybeSingle();

      await supabase.from('kiosk_commands').insert({
        id: commandId,
        kiosk_id: kiosk?.id || null,
        device_id: deviceId,
        type,
        payload: payload || {},
        status: 'pending',
        created_at: now,
      });
    } catch (err) {
      console.warn('Supabase createCommand error:', err);
    }

    // Memory cache
    memoryCommands.set(commandId, {
      id: commandId,
      deviceId,
      type,
      payload,
      status: 'pending',
      createdAt: now,
      executedAt: null,
    });

    return {
      commandId,
      deviceId,
      type,
      status: 'pending',
    };
  },

  // 7. Acknowledge command execution
  async acknowledgeCommand(deviceId: string, commandId: string, status: string = 'executed'): Promise<boolean> {
    const now = new Date().toISOString();

    try {
      await supabase
        .from('kiosk_commands')
        .update({
          status: status,
          executed_at: now,
        })
        .eq('id', commandId)
        .eq('device_id', deviceId);
    } catch (err) {
      console.warn('Supabase ack error:', err);
    }

    const memCmd = memoryCommands.get(commandId);
    if (memCmd && memCmd.deviceId === deviceId) {
      memCmd.status = status as 'pending' | 'executed' | 'failed';
      memCmd.executedAt = now;
    }

    return true;
  },

  // 8. Toggle / Set Maintenance Mode
  async setMaintenanceMode(
    deviceId: string,
    enabled: boolean,
    message?: string
  ): Promise<{ deviceId: string; maintenanceMode: boolean; message?: string | null }> {
    const now = new Date().toISOString();

    try {
      await supabase
        .from('kiosks')
        .update({
          maintenance_mode: enabled,
          maintenance_message: enabled ? (message || null) : null,
          updated_at: now,
        })
        .eq('device_id', deviceId);
    } catch (err) {
      console.warn('Supabase maintenance update error:', err);
    }

    const mem = memoryKiosks.get(deviceId);
    if (mem) {
      mem.maintenanceMode = enabled;
      mem.maintenanceMessage = enabled ? (message || null) : null;
    }

    return {
      deviceId,
      maintenanceMode: enabled,
      message: enabled ? (message || null) : undefined,
    };
  },

  // 9. Get kiosk config - Authoritative source of truth for KioskUrl & runtime parameters
  async getKioskConfig(deviceId: string): Promise<KioskConfigData | null> {
    const kiosk = await this.getKioskByDeviceId(deviceId);
    if (!kiosk) return null;

    const kioskUrl = kiosk.kioskUrl || kiosk.url || DEFAULT_KIOSK_URL;

    return {
      deviceId: kiosk.deviceId,
      name: kiosk.name,
      maintenanceMode: kiosk.maintenanceMode,
      maintenanceMessage: kiosk.maintenanceMessage,
      appVersion: kiosk.appVersion,
      kioskUrl: kioskUrl,
      url: kioskUrl,
      refreshInterval: kiosk.refreshInterval || 30,
      allowTransactions: kiosk.allowTransactions !== undefined ? kiosk.allowTransactions : true,
      theme: kiosk.theme || 'default',
    };
  },

  // 10. Update kiosk URL - Source of truth updated from dashboard or API
  async updateKioskUrl(deviceId: string, url: string): Promise<{ deviceId: string; url: string; kioskUrl: string }> {
    const now = new Date().toISOString();

    try {
      await supabase
        .from('kiosks')
        .update({
          url,
          updated_at: now,
        })
        .eq('device_id', deviceId);
    } catch (err) {
      console.warn('Supabase updateUrl error:', err);
    }

    const mem = memoryKiosks.get(deviceId);
    if (mem) {
      mem.url = url;
      mem.kioskUrl = url;
    }

    return {
      deviceId,
      url,
      kioskUrl: url,
    };
  },

  // Get recent commands for all or specific kiosk
  async getRecentCommands(deviceId?: string): Promise<KioskCommand[]> {
    try {
      let query = supabase
        .from('kiosk_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return Array.from(memoryCommands.values())
          .filter((c) => !deviceId || c.deviceId === deviceId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return data.map((d) => ({
        id: d.id,
        kioskId: d.kiosk_id,
        deviceId: d.device_id,
        type: d.type,
        payload: d.payload,
        status: d.status as 'pending' | 'executed' | 'failed' | 'cancelled',
        createdAt: d.created_at,
        executedAt: d.executed_at,
      }));
    } catch {
      return Array.from(memoryCommands.values())
        .filter((c) => !deviceId || c.deviceId === deviceId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  // 11. Update kiosk details (name, deviceId, location, os)
  async updateKioskDetails(
    deviceId: string,
    payload: {
      name?: string;
      newDeviceId?: string;
      location?: string;
      os?: string;
    }
  ): Promise<Kiosk | null> {
    const now = new Date().toISOString();
    const targetDeviceId = payload.newDeviceId?.trim() ? payload.newDeviceId.trim().toUpperCase() : deviceId;

    try {
      const updateData: Record<string, unknown> = {
        updated_at: now,
      };

      if (payload.name !== undefined) updateData.name = payload.name.trim();
      if (payload.location !== undefined) updateData.location = payload.location.trim();
      if (payload.os !== undefined) updateData.os = payload.os.trim();
      if (payload.newDeviceId && targetDeviceId !== deviceId) {
        updateData.device_id = targetDeviceId;
      }

      const { error } = await supabase
        .from('kiosks')
        .update(updateData)
        .eq('device_id', deviceId);

      if (error) {
        console.warn('Supabase updateKioskDetails error:', error);
      }

      // If deviceId changed, update foreign key records in kiosk_commands table
      if (payload.newDeviceId && targetDeviceId !== deviceId) {
        await supabase
          .from('kiosk_commands')
          .update({ device_id: targetDeviceId })
          .eq('device_id', deviceId);
      }
    } catch (err) {
      console.warn('Supabase updateKioskDetails error:', err);
    }

    // Memory cache update
    const mem = memoryKiosks.get(deviceId);
    let updatedKiosk: Kiosk;

    if (mem) {
      if (payload.name !== undefined) mem.name = payload.name.trim();
      if (payload.location !== undefined) mem.location = payload.location.trim();
      if (payload.os !== undefined) mem.os = payload.os.trim();
      mem.updatedAt = now;

      if (payload.newDeviceId && targetDeviceId !== deviceId) {
        mem.deviceId = targetDeviceId;
        memoryKiosks.delete(deviceId);
        memoryKiosks.set(targetDeviceId, mem);

        // Update commands in memory
        for (const cmd of memoryCommands.values()) {
          if (cmd.deviceId === deviceId) {
            cmd.deviceId = targetDeviceId;
          }
        }
      }
      updatedKiosk = { ...mem, status: computeKioskStatus(mem.lastSeen) };
    } else {
      const fetched = await this.getKioskByDeviceId(targetDeviceId);
      if (!fetched) return null;
      updatedKiosk = fetched;
    }

    return updatedKiosk;
  },
};


