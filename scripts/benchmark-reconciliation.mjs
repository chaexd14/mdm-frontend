import { performance } from 'node:perf_hooks';
import { mergeEvents, mergeSnapshot } from '../src/lib/reconciliation.ts';
let devices = Array.from({ length: 10000 }, (_, i) => ({ deviceId: 'DEVICE-' + String(i).padStart(5, '0'), revision: 1, name: 'Tablet ' + i, status: 'online', connectionQuality: 'healthy' }));
const updates = [], snapshots = [];
for (let run = 0; run < 60; run++) {
  const batch = Array.from({ length: 100 }, (_, offset) => { const device = devices[(run * 100 + offset) % devices.length]; return { deviceId: device.deviceId, device: { revision: device.revision + 1, batteryLevel: run }, partial: true }; });
  let start = performance.now(); devices = mergeEvents(devices, batch); if (run >= 10) updates.push(performance.now() - start);
  const snapshot = devices.map(device => ({ ...device }));
  start = performance.now(); devices = mergeSnapshot(devices, snapshot, new Map(), 0); if (run >= 10) snapshots.push(performance.now() - start);
}
const stats = values => { const sorted = [...values].sort((a, b) => a - b); return { medianMs: +sorted[Math.floor(sorted.length / 2)].toFixed(3), p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(3) }; };
console.log(JSON.stringify({ devices: devices.length, samples: 50, updatesPerBatch: 100, batchedMerge: stats(updates), unchangedSnapshot: stats(snapshots), scope: 'Node data reconciliation only; excludes browser rendering, networking, and tablet performance' }, null, 2));
