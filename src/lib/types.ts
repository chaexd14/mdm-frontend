export type DeviceStatus = 'online' | 'offline';
export type MdmDeviceStatus = DeviceStatus;
export type KioskStatus = DeviceStatus;

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  os: string;
  agentVersion: string;
  appVersion: string;
  lastSeen: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  url: string;
  targetUrl?: string;
  kioskUrl?: string;
  refreshInterval: number;
  allowTransactions: boolean;
  theme: string;
  status: DeviceStatus;
  // Android MDM Telemetry
  batteryLevel?: number;
  isCharging?: boolean;
  isDeviceOwner?: boolean;
  lockTaskState?: 'NONE' | 'LOCKED' | 'PINNED' | string;
  model?: string;
  manufacturer?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Backward-compatible alias for existing code
export type Kiosk = Device;
export type MdmDevice = Device;

export interface DeviceConfigData {
  deviceId?: string;
  name?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  appVersion: string;
  url: string;
  targetUrl?: string;
  kioskUrl?: string;
  refreshInterval?: number;
  allowTransactions?: boolean;
  theme?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  isDeviceOwner?: boolean;
  lockTaskState?: string;
  model?: string;
  manufacturer?: string;
}

export type KioskConfigData = DeviceConfigData;
export type MdmDeviceConfigData = DeviceConfigData;

export interface DeviceCommand {
  id: string;
  deviceId: string;
  kioskId?: string;
  type: string;
  payload?: Record<string, unknown>;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  createdAt: string;
  executedAt: string | null;
}

export type KioskCommand = DeviceCommand;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EnrollDeviceRequest {
  deviceId: string;
  deviceName?: string;
  name?: string;
  os?: string;
  agentVersion?: string;
  appVersion?: string;
  location?: string;
  url?: string;
  targetUrl?: string;
  kioskUrl?: string;
  // Android MDM Telemetry
  batteryLevel?: number;
  isCharging?: boolean;
  isDeviceOwner?: boolean;
  lockTaskState?: string;
  model?: string;
  manufacturer?: string;
}

export type RegisterKioskRequest = EnrollDeviceRequest;

export interface HeartbeatRequest {
  deviceId: string;
  agentVersion?: string;
  appVersion?: string;
  timestamp?: string;
  // Android MDM Telemetry
  batteryLevel?: number;
  isCharging?: boolean;
  isDeviceOwner?: boolean;
  lockTaskState?: string;
}

export interface CreateCommandRequest {
  type: string;
  payload?: Record<string, unknown>;
}

export interface AckCommandRequest {
  status: 'executed' | 'failed' | 'pending';
}

export interface MaintenanceRequest {
  enabled: boolean;
  message?: string;
}

export interface UpdateUrlRequest {
  url?: string;
  targetUrl?: string;
  kioskUrl?: string;
}

export interface UpdateDeviceDetailsRequest {
  name?: string;
  newDeviceId?: string;
  location?: string;
  os?: string;
  model?: string;
  manufacturer?: string;
}

export type UpdateKioskDetailsRequest = UpdateDeviceDetailsRequest;



