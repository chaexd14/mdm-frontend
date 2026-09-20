import { supabase } from './supabase';
import { Device, DeviceCommand, DeviceConfigData, DeviceStatus, EnrollDeviceRequest, HeartbeatRequest, UpdateDeviceDetailsRequest } from './types';

export const DEFAULT_DEVICE_URL = 'https://app.hotel.dev.saikotechsolutions.com';
export const DEFAULT_KIOSK_URL = DEFAULT_DEVICE_URL;

// Helper to compute status based on 90s threshold
export function computeDeviceStatus(lastSeenStr?: string | null): DeviceStatus {
  if (!lastSeenStr) return 'offline';
  try {
    const lastSeenTime = new Date(lastSeenStr).getTime();
    const now = Date.now();
    return (now - lastSeenTime) < 90 * 1000 ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export const computeKioskStatus = computeDeviceStatus;

// Convert DB snake_case record to CamelCase Device object
export function mapDbDeviceToModel(dbRecord: Record<string, unknown>): Device {
  const lastSeen = (dbRecord.last_seen as string) || new Date().toISOString();
  const url = (dbRecord.kiosk_url as string) || (dbRecord.url as string) || DEFAULT_DEVICE_URL;

  return {
    id: (dbRecord.id as string) || '',
    deviceId: (dbRecord.device_id as string) || '',
    name: (dbRecord.name as string) || (dbRecord.device_id as string) || 'Android MDM Device',
    location: (dbRecord.location as string) || 'Manila',
    os: (dbRecord.os as string) || 'Android 14',
    agentVersion: (dbRecord.agent_version as string) || '1.0.0',
    appVersion: (dbRecord.app_version as string) || '1.0.0',
    lastSeen: lastSeen,
    maintenanceMode: Boolean(dbRecord.maintenance_mode),
    maintenanceMessage: (dbRecord.maintenance_message as string) || null,
    url: url,
    targetUrl: url,
    kioskUrl: url,
    refreshInterval: Number(dbRecord.refresh_interval) || 30,
    allowTransactions: dbRecord.allow_transactions !== undefined ? Boolean(dbRecord.allow_transactions) : true,
    theme: (dbRecord.theme as string) || 'default',
    status: computeDeviceStatus(lastSeen),
    // Android MDM Telemetry
    batteryLevel: dbRecord.battery_level !== undefined && dbRecord.battery_level !== null ? Number(dbRecord.battery_level) : undefined,
    isCharging: dbRecord.is_charging !== undefined && dbRecord.is_charging !== null ? Boolean(dbRecord.is_charging) : undefined,
    isDeviceOwner: dbRecord.is_device_owner !== undefined && dbRecord.is_device_owner !== null ? Boolean(dbRecord.is_device_owner) : undefined,
    lockTaskState: (dbRecord.lock_task_state as string) || undefined,
    model: (dbRecord.model as string) || undefined,
    manufacturer: (dbRecord.manufacturer as string) || undefined,
    createdAt: (dbRecord.created_at as string) || undefined,
    updatedAt: (dbRecord.updated_at as string) || undefined,
  };
}

export const mapDbKioskToModel = mapDbDeviceToModel;

// In-memory fallback cache to store live state & telemetry seamlessly
const memoryDevices: Map<string, Device> = new Map();
const memoryCommands: Map<string, DeviceCommand> = new Map();

// Real-time command dispatch listeners
export type CommandItem = { id: string; type: string; payload?: Record<string, unknown>; createdAt: string };
export type CommandListener = (commands: CommandItem[]) => void;
const commandWaitingListeners = new Map<string, Set<CommandListener>>();

// Helper to merge in-memory telemetry if DB lacks columns
function mergeMemTelemetry(device: Device): Device {
  const mem = memoryDevices.get(device.deviceId);
  if (mem) {
    if (device.batteryLevel === undefined) device.batteryLevel = mem.batteryLevel;
    if (device.isCharging === undefined) device.isCharging = mem.isCharging;
    if (device.isDeviceOwner === undefined) device.isDeviceOwner = mem.isDeviceOwner;
    if (!device.lockTaskState) device.lockTaskState = mem.lockTaskState;
    if (!device.model) device.model = mem.model;
    if (!device.manufacturer) device.manufacturer = mem.manufacturer;
  }
  return device;
}

// Flag and timer for background DB sync
let isSyncingWithDb = false;
let lastDbSyncTime = 0;

async function syncWithSupabaseInBackground() {
  const now = Date.now();
  if (isSyncingWithDb || now - lastDbSyncTime < 5000) return;
  isSyncingWithDb = true;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase sync timeout')), 4000)
    );
    const fetchPromise = supabase
      .from('kiosks')
      .select('*')
      .order('device_id', { ascending: true });

    const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]);

    if (!error && data) {
      data.forEach((row: Record<string, unknown>) => {
        const dev = mapDbDeviceToModel(row);
        const existing = memoryDevices.get(dev.deviceId);
        if (existing) {
          // Preserve newer telemetry if recently updated in memory
          if (new Date(existing.lastSeen).getTime() > new Date(dev.lastSeen).getTime()) {
            return;
          }
        }
        memoryDevices.set(dev.deviceId, mergeMemTelemetry(dev));
      });
      lastDbSyncTime = Date.now();
    }
  } catch (err) {
    // Background sync failure is non-fatal
  } finally {
    isSyncingWithDb = false;
  }
}

export const deviceService = {
  // 1. Get all devices (Instant memory-first with background DB sync)
  async getAllDevices(): Promise<Device[]> {
    // If memory cache is empty, try quick initial load from Supabase with timeout
    if (memoryDevices.size === 0) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase initial timeout')), 3000)
        );
        const fetchPromise = supabase
          .from('kiosks')
          .select('*')
          .order('device_id', { ascending: true });

        const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]);

        if (!error && data) {
          const devices = data.map(mapDbDeviceToModel).map(mergeMemTelemetry);
          devices.forEach((d: Device) => memoryDevices.set(d.deviceId, d));
          lastDbSyncTime = Date.now();
          return devices;
        }
      } catch {
        // Fallback to empty memory cache
      }
    } else {
      // Trigger background sync
      syncWithSupabaseInBackground().catch(() => {});
    }

    return Array.from(memoryDevices.values()).map((d) => ({
      ...d,
      status: computeDeviceStatus(d.lastSeen),
    }));
  },

  async getAllKiosks(): Promise<Device[]> {
    return this.getAllDevices();
  },

  // 2. Get single device by deviceId
  async getDeviceByDeviceId(deviceId: string): Promise<Device | null> {
    const mem = memoryDevices.get(deviceId);
    if (mem) {
      return { ...mem, status: computeDeviceStatus(mem.lastSeen) };
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase timeout')), 3000)
      );
      const fetchPromise = supabase
        .from('kiosks')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (error || !data) {
        return null;
      }

      const device = mergeMemTelemetry(mapDbDeviceToModel(data));
      memoryDevices.set(device.deviceId, device);
      return device;
    } catch {
      return null;
    }
  },

  async getKioskByDeviceId(deviceId: string): Promise<Device | null> {
    return this.getDeviceByDeviceId(deviceId);
  },

  // 3. Register or update device
  async registerOrUpdateDevice(payload: EnrollDeviceRequest): Promise<{ deviceId: string; registered: boolean; targetUrl: string; kioskUrl: string }> {
    const {
      deviceId,
      deviceName,
      name,
      os,
      agentVersion,
      appVersion,
      location,
      url,
      targetUrl,
      kioskUrl,
      batteryLevel,
      isCharging,
      isDeviceOwner,
      lockTaskState,
      model,
      manufacturer,
    } = payload;

    const resolvedName = deviceName || name || deviceId;
    const resolvedUrl = targetUrl || kioskUrl || url || DEFAULT_DEVICE_URL;
    const resolvedOs = os || 'Android 14';
    const now = new Date().toISOString();

    // 1. Instant Memory cache update (Immediate UI & Agent reactivity)
    const existingMem = memoryDevices.get(deviceId);
    const finalUrl = (targetUrl || kioskUrl || url) ? resolvedUrl : (existingMem?.targetUrl || existingMem?.url || resolvedUrl);
    memoryDevices.set(deviceId, {
      id: existingMem?.id || `dev_${Date.now()}`,
      deviceId,
      name: resolvedName,
      location: location || existingMem?.location || 'Manila',
      os: resolvedOs,
      agentVersion: agentVersion || existingMem?.agentVersion || '1.0.0',
      appVersion: appVersion || existingMem?.appVersion || '1.0.0',
      lastSeen: now,
      maintenanceMode: existingMem?.maintenanceMode || false,
      maintenanceMessage: existingMem?.maintenanceMessage || null,
      url: finalUrl,
      targetUrl: finalUrl,
      kioskUrl: finalUrl,
      refreshInterval: existingMem?.refreshInterval || 30,
      allowTransactions: existingMem?.allowTransactions !== undefined ? existingMem.allowTransactions : true,
      theme: existingMem?.theme || 'default',
      status: 'online',
      batteryLevel: batteryLevel !== undefined ? batteryLevel : existingMem?.batteryLevel,
      isCharging: isCharging !== undefined ? isCharging : existingMem?.isCharging,
      isDeviceOwner: isDeviceOwner !== undefined ? isDeviceOwner : existingMem?.isDeviceOwner,
      lockTaskState: lockTaskState !== undefined ? lockTaskState : existingMem?.lockTaskState,
      model: model !== undefined ? model : existingMem?.model,
      manufacturer: manufacturer !== undefined ? manufacturer : existingMem?.manufacturer,
    });

    // 2. Background DB Sync with timeout (Non-blocking)
    (async () => {
      try {
        const { data: existing } = await supabase
          .from('kiosks')
          .select('id, url')
          .eq('device_id', deviceId)
          .maybeSingle();

        if (existing) {
          const updateData: Record<string, unknown> = {
            name: resolvedName,
            os: resolvedOs,
            agent_version: agentVersion || '1.0.0',
            app_version: appVersion || '1.0.0',
            location: location || 'Manila',
            last_seen: now,
            updated_at: now,
          };
          if (targetUrl || kioskUrl || url) {
            updateData.url = resolvedUrl;
          }
          if (batteryLevel !== undefined) updateData.battery_level = batteryLevel;
          if (isCharging !== undefined) updateData.is_charging = isCharging;
          if (isDeviceOwner !== undefined) updateData.is_device_owner = isDeviceOwner;
          if (lockTaskState !== undefined) updateData.lock_task_state = lockTaskState;
          if (model !== undefined) updateData.model = model;
          if (manufacturer !== undefined) updateData.manufacturer = manufacturer;

          const { error: updateErr } = await supabase
            .from('kiosks')
            .update(updateData)
            .eq('device_id', deviceId);

          if (updateErr && updateErr.message?.includes('column')) {
            delete updateData.battery_level;
            delete updateData.is_charging;
            delete updateData.is_device_owner;
            delete updateData.lock_task_state;
            delete updateData.model;
            delete updateData.manufacturer;
            await supabase.from('kiosks').update(updateData).eq('device_id', deviceId);
          }
        } else {
          const insertData: Record<string, unknown> = {
            device_id: deviceId,
            name: resolvedName,
            os: resolvedOs,
            agent_version: agentVersion || '1.0.0',
            app_version: appVersion || '1.0.0',
            location: location || 'Manila',
            last_seen: now,
            maintenance_mode: false,
            url: resolvedUrl,
            refresh_interval: 30,
            allow_transactions: true,
            theme: 'default',
          };
          if (batteryLevel !== undefined) insertData.battery_level = batteryLevel;
          if (isCharging !== undefined) insertData.is_charging = isCharging;
          if (isDeviceOwner !== undefined) insertData.is_device_owner = isDeviceOwner;
          if (lockTaskState !== undefined) insertData.lock_task_state = lockTaskState;
          if (model !== undefined) insertData.model = model;
          if (manufacturer !== undefined) insertData.manufacturer = manufacturer;

          const { error: insertErr } = await supabase.from('kiosks').insert(insertData);
          if (insertErr && insertErr.message?.includes('column')) {
            delete insertData.battery_level;
            delete insertData.is_charging;
            delete insertData.is_device_owner;
            delete insertData.lock_task_state;
            delete insertData.model;
            delete insertData.manufacturer;
            await supabase.from('kiosks').insert(insertData);
          }
        }
      } catch (err) {
        console.warn('Background Supabase register notice:', err);
      }
    })().catch(() => {});

    return { deviceId, registered: true, targetUrl: finalUrl, kioskUrl: finalUrl };
  },

  async registerKiosk(payload: EnrollDeviceRequest) {
    return this.registerOrUpdateDevice(payload);
  },

  // 4. Heartbeat
  async recordHeartbeat(payload: HeartbeatRequest): Promise<{ deviceId: string; maintenanceMode: boolean; serverTime: string; targetUrl?: string; kioskUrl?: string }> {
    const { deviceId, agentVersion, appVersion, batteryLevel, isCharging, isDeviceOwner, lockTaskState } = payload;
    const now = new Date().toISOString();

    // 1. Instant Memory cache update
    let maintenanceMode = false;
    let currentTargetUrl = DEFAULT_DEVICE_URL;

    const mem = memoryDevices.get(deviceId);
    if (mem) {
      maintenanceMode = mem.maintenanceMode;
      currentTargetUrl = mem.targetUrl || mem.url || DEFAULT_DEVICE_URL;
      mem.lastSeen = now;
      if (agentVersion) mem.agentVersion = agentVersion;
      if (appVersion) mem.appVersion = appVersion;
      if (batteryLevel !== undefined) mem.batteryLevel = batteryLevel;
      if (isCharging !== undefined) mem.isCharging = isCharging;
      if (isDeviceOwner !== undefined) mem.isDeviceOwner = isDeviceOwner;
      if (lockTaskState !== undefined) mem.lockTaskState = lockTaskState;
      mem.status = 'online';
    } else {
      memoryDevices.set(deviceId, {
        id: `dev_${Date.now()}`,
        deviceId,
        name: deviceId,
        location: 'Manila',
        os: 'Android 14',
        agentVersion: agentVersion || '1.0.0',
        appVersion: appVersion || '1.0.0',
        lastSeen: now,
        maintenanceMode: false,
        maintenanceMessage: null,
        url: DEFAULT_DEVICE_URL,
        targetUrl: DEFAULT_DEVICE_URL,
        kioskUrl: DEFAULT_DEVICE_URL,
        refreshInterval: 30,
        allowTransactions: true,
        theme: 'default',
        status: 'online',
        batteryLevel,
        isCharging,
        isDeviceOwner,
        lockTaskState,
      });
    }

    // 2. Background DB Sync with timeout
    (async () => {
      try {
        const updateData: Record<string, unknown> = {
          last_seen: now,
          updated_at: now,
        };
        if (agentVersion) updateData.agent_version = agentVersion;
        if (appVersion) updateData.app_version = appVersion;
        if (batteryLevel !== undefined) updateData.battery_level = batteryLevel;
        if (isCharging !== undefined) updateData.is_charging = isCharging;
        if (isDeviceOwner !== undefined) updateData.is_device_owner = isDeviceOwner;
        if (lockTaskState !== undefined) updateData.lock_task_state = lockTaskState;

        const { error: hbErr } = await supabase
          .from('kiosks')
          .update(updateData)
          .eq('device_id', deviceId);

        if (hbErr && hbErr.message?.includes('column')) {
          delete updateData.battery_level;
          delete updateData.is_charging;
          delete updateData.is_device_owner;
          delete updateData.lock_task_state;
          await supabase.from('kiosks').update(updateData).eq('device_id', deviceId);
        }
      } catch (err) {
        // Non-fatal
      }
    })().catch(() => {});

    return {
      deviceId,
      maintenanceMode,
      serverTime: now,
      targetUrl: currentTargetUrl,
      kioskUrl: currentTargetUrl,
    };
  },

  async heartbeat(payload: HeartbeatRequest) {
    return this.recordHeartbeat(payload);
  },

  // 5. Get pending commands for device (Instant real-time push via waitMs)
  async getPendingCommands(deviceId: string, waitMs: number = 0): Promise<CommandItem[]> {
    // Check pending in memory cache first
    const pending = Array.from(memoryCommands.values())
      .filter((c) => c.deviceId === deviceId && c.status === 'pending')
      .map((c) => ({ id: c.id, type: c.type, payload: c.payload, createdAt: c.createdAt }));

    if (pending.length > 0) {
      return pending;
    }

    // If waitMs is requested and no commands pending, wait for real-time trigger
    if (waitMs > 0) {
      return new Promise<CommandItem[]>((resolve) => {
        let timer: NodeJS.Timeout | null = null;
        let listeners = commandWaitingListeners.get(deviceId);
        if (!listeners) {
          listeners = new Set();
          commandWaitingListeners.set(deviceId, listeners);
        }

        const currentSet = listeners;
        const listener: CommandListener = (cmds) => {
          if (timer) clearTimeout(timer);
          currentSet.delete(listener);
          resolve(cmds);
        };

        currentSet.add(listener);

        timer = setTimeout(() => {
          currentSet.delete(listener);
          resolve([]);
        }, waitMs);
      });
    }

    return [];
  },

  // 6. Create command for device (Instant Real-time Dispatch)
  async createCommand(
    deviceId: string,
    type: string,
    payload?: Record<string, unknown>
  ): Promise<{ commandId: string; deviceId: string; type: string; status: string }> {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const cmdItem: DeviceCommand = {
      id: commandId,
      deviceId,
      type,
      payload,
      status: 'pending',
      createdAt: now,
      executedAt: null,
    };

    // 1. Store in memory cache immediately
    memoryCommands.set(commandId, cmdItem);

    // 2. Instantly notify any active long-polling connection (< 5ms dispatch)
    const listeners = commandWaitingListeners.get(deviceId);
    if (listeners && listeners.size > 0) {
      const formatted: CommandItem[] = [{ id: commandId, type, payload, createdAt: now }];
      listeners.forEach((listener) => {
        try {
          listener(formatted);
        } catch {}
      });
      listeners.clear();
    }

    // 3. Background DB Sync with Supabase (non-blocking)
    (async () => {
      try {
        const { data: dev } = await supabase
          .from('kiosks')
          .select('id')
          .eq('device_id', deviceId)
          .maybeSingle();

        await supabase.from('kiosk_commands').insert({
          id: commandId,
          kiosk_id: dev?.id || null,
          device_id: deviceId,
          type,
          payload: payload || {},
          status: 'pending',
          created_at: now,
        });
      } catch (err) {
        // Non-fatal
      }
    })().catch(() => {});

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
      console.warn('Supabase ack notice:', err);
    }

    const memCmd = memoryCommands.get(commandId);
    if (memCmd && memCmd.deviceId === deviceId) {
      memCmd.status = status as 'pending' | 'executed' | 'failed';
      memCmd.executedAt = now;
    }

    return true;
  },

  // 8. Toggle / Set Maintenance Mode
  async setDeviceMaintenance(
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
      console.warn('Supabase maintenance update notice:', err);
    }

    const mem = memoryDevices.get(deviceId);
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

  async setMaintenanceMode(deviceId: string, enabled: boolean, message?: string) {
    return this.setDeviceMaintenance(deviceId, enabled, message);
  },

  // 9. Get device config - Authoritative source of truth for targetUrl & runtime parameters
  async getDeviceConfig(deviceId: string): Promise<DeviceConfigData | null> {
    const device = await this.getDeviceByDeviceId(deviceId);
    if (!device) return null;

    const targetUrl = device.targetUrl || device.kioskUrl || device.url || DEFAULT_DEVICE_URL;

    return {
      deviceId: device.deviceId,
      name: device.name,
      maintenanceMode: device.maintenanceMode,
      maintenanceMessage: device.maintenanceMessage,
      appVersion: device.appVersion,
      url: targetUrl,
      targetUrl: targetUrl,
      kioskUrl: targetUrl,
      refreshInterval: device.refreshInterval || 30,
      allowTransactions: device.allowTransactions !== undefined ? device.allowTransactions : true,
      theme: device.theme || 'default',
      batteryLevel: device.batteryLevel,
      isCharging: device.isCharging,
      isDeviceOwner: device.isDeviceOwner,
      lockTaskState: device.lockTaskState,
      model: device.model,
      manufacturer: device.manufacturer,
    };
  },

  async getKioskConfig(deviceId: string) {
    return this.getDeviceConfig(deviceId);
  },

  // 10. Update device URL - Source of truth updated from dashboard or API
  async updateDeviceUrl(deviceId: string, url: string): Promise<{ deviceId: string; url: string; targetUrl: string; kioskUrl: string }> {
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
      console.warn('Supabase updateUrl notice:', err);
    }

    const mem = memoryDevices.get(deviceId);
    if (mem) {
      mem.url = url;
      mem.targetUrl = url;
      mem.kioskUrl = url;
    }

    return {
      deviceId,
      url,
      targetUrl: url,
      kioskUrl: url,
    };
  },

  async updateKioskUrl(deviceId: string, url: string) {
    return this.updateDeviceUrl(deviceId, url);
  },

  // Get recent commands for all or specific device
  async getRecentCommands(deviceId?: string): Promise<DeviceCommand[]> {
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
        payload: (d.payload as Record<string, unknown>) || undefined,
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

  // 11. Update device details (name, deviceId, location, os, model, manufacturer)
  async updateDeviceDetails(
    deviceId: string,
    payload: UpdateDeviceDetailsRequest
  ): Promise<Device | null> {
    const now = new Date().toISOString();
    const targetDeviceId = payload.newDeviceId?.trim() ? payload.newDeviceId.trim().toUpperCase() : deviceId;

    try {
      const updateData: Record<string, unknown> = {
        updated_at: now,
      };

      if (payload.name !== undefined) updateData.name = payload.name.trim();
      if (payload.location !== undefined) updateData.location = payload.location.trim();
      if (payload.os !== undefined) updateData.os = payload.os.trim();
      if (payload.model !== undefined) updateData.model = payload.model.trim();
      if (payload.manufacturer !== undefined) updateData.manufacturer = payload.manufacturer.trim();
      if (payload.newDeviceId && targetDeviceId !== deviceId) {
        updateData.device_id = targetDeviceId;
      }

      const { error } = await supabase
        .from('kiosks')
        .update(updateData)
        .eq('device_id', deviceId);

      if (error && error.message?.includes('column')) {
        delete updateData.model;
        delete updateData.manufacturer;
        await supabase.from('kiosks').update(updateData).eq('device_id', deviceId);
      }

      // If deviceId changed, update foreign key records in kiosk_commands table
      if (payload.newDeviceId && targetDeviceId !== deviceId) {
        await supabase
          .from('kiosk_commands')
          .update({ device_id: targetDeviceId })
          .eq('device_id', deviceId);
      }
    } catch (err) {
      console.warn('Supabase updateDeviceDetails notice:', err);
    }

    // Memory cache update
    const mem = memoryDevices.get(deviceId);
    let updatedDevice: Device;

    if (mem) {
      if (payload.name !== undefined) mem.name = payload.name.trim();
      if (payload.location !== undefined) mem.location = payload.location.trim();
      if (payload.os !== undefined) mem.os = payload.os.trim();
      if (payload.model !== undefined) mem.model = payload.model.trim();
      if (payload.manufacturer !== undefined) mem.manufacturer = payload.manufacturer.trim();
      mem.updatedAt = now;

      if (payload.newDeviceId && targetDeviceId !== deviceId) {
        mem.deviceId = targetDeviceId;
        memoryDevices.delete(deviceId);
        memoryDevices.set(targetDeviceId, mem);

        // Update commands in memory
        for (const cmd of memoryCommands.values()) {
          if (cmd.deviceId === deviceId) {
            cmd.deviceId = targetDeviceId;
          }
        }
      }
      updatedDevice = { ...mem, status: computeDeviceStatus(mem.lastSeen) };
    } else {
      const fetched = await this.getDeviceByDeviceId(targetDeviceId);
      if (!fetched) return null;
      updatedDevice = fetched;
    }

    return updatedDevice;
  },

  async updateKioskDetails(deviceId: string, payload: UpdateDeviceDetailsRequest) {
    return this.updateDeviceDetails(deviceId, payload);
  },
};
