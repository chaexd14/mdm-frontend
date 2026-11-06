import type { Device } from './types';
export function newer(incoming: Partial<Device>, current: Device) {
  if (incoming.id && current.id && incoming.id !== current.id && /^\d+$/.test(incoming.id) && /^\d+$/.test(current.id)) return BigInt(incoming.id) > BigInt(current.id);
  if (incoming.createdAt && current.createdAt && incoming.createdAt !== current.createdAt) return Date.parse(incoming.createdAt) > Date.parse(current.createdAt);
  return (incoming.revision ?? -1) >= (current.revision ?? -1);
}
function reuse(previous: Device | undefined, next: Device) {
  if (previous?.revision != null && previous.revision === next.revision && previous.createdAt === next.createdAt && previous.status === next.status && previous.connectionQuality === next.connectionQuality) return previous;
  if (previous && Object.keys(next).every(key => JSON.stringify(previous[key as keyof Device]) === JSON.stringify(next[key as keyof Device]))) return previous;
  return next;
}
export type Tombstone = number | { sequence: number; id?: string };
export function mergeSnapshot(previous: Device[], snapshot: Device[], changedAt: Map<string, number>, started: number, deletedAt: Map<string, Tombstone> = new Map()) {
  const current = new Map(previous.map(device => [device.deviceId, device]));
  const result: Device[] = [];
  const seen = new Set<string>();
  for (const device of snapshot) {
    seen.add(device.deviceId);
    const existing = current.get(device.deviceId);
    const deleted = deletedAt.get(device.deviceId);
    const deletionSequence = typeof deleted === 'number' ? deleted : deleted?.sequence ?? 0;
    const sameDeletedRecord = typeof deleted === 'number' || !deleted?.id || deleted.id === device.id;
    if (!existing && deletionSequence > started && sameDeletedRecord) continue;
    result.push(existing && !newer(device, existing) ? existing : reuse(existing, device));
  }
  for (const device of previous) if (!seen.has(device.deviceId) && (changedAt.get(device.deviceId) ?? 0) > started) result.push(device);
  return result.length === previous.length && result.every((device, index) => device === previous[index]) ? previous : result;
}
export type DeviceEvent = { deviceId: string; device?: Partial<Device>; partial?: boolean; deletedId?: string };
export function mergeEvents(previous: Device[], events: DeviceEvent[]) {
  const current = new Map(previous.map(device => [device.deviceId, device]));
  for (const event of events) {
    if (!event.device) { const existing = current.get(event.deviceId); if (!event.deletedId || !existing?.id || event.deletedId === existing.id) current.delete(event.deviceId); continue; }
    const existing = current.get(event.deviceId);
    if (event.partial && (!existing || (event.device.id && existing.id && event.device.id !== existing.id))) continue;
    if (existing && !newer(event.device, existing)) continue;
    current.set(event.deviceId, reuse(existing, { ...existing, ...event.device } as Device));
  }
  const result = [...current.values()];
  return result.length === previous.length && result.every((device, index) => device === previous[index]) ? previous : result;
}
