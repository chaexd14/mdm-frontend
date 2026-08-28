export type KioskStatus = 'online' | 'offline';

export interface Kiosk {
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
  kioskUrl?: string;
  refreshInterval: number;
  allowTransactions: boolean;
  theme: string;
  status: KioskStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface KioskConfigData {
  deviceId?: string;
  name?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  appVersion: string;
  kioskUrl: string;
  url?: string;
  refreshInterval?: number;
  allowTransactions?: boolean;
  theme?: string;
}

export interface KioskCommand {
  id: string;
  kioskId?: string;
  deviceId: string;
  type: string;
  payload?: Record<string, unknown>;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  createdAt: string;
  executedAt: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RegisterKioskRequest {
  deviceId: string;
  deviceName?: string;
  name?: string;
  os?: string;
  agentVersion?: string;
  appVersion?: string;
  location?: string;
  url?: string;
  kioskUrl?: string;
}

export interface HeartbeatRequest {
  deviceId: string;
  agentVersion?: string;
  appVersion?: string;
  timestamp?: string;
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
  kioskUrl?: string;
}

export interface UpdateKioskDetailsRequest {
  name?: string;
  newDeviceId?: string;
  location?: string;
  os?: string;
}


