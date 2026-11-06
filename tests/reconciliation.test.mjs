import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSnapshot, mergeEvents } from '../src/lib/reconciliation.ts';
const device = (id, revision = 1) => ({ deviceId: id, revision, name: id, status: 'online', connectionQuality: 'healthy' });
test('an event for a different device does not discard an entire snapshot', () => {
 const previous = [device('a', 3), device('b', 1)];
 const result = mergeSnapshot(previous, [device('a', 2), device('b', 2), device('c')], new Map([['a', 2]]), 1);
 assert.deepEqual(result.map(item => [item.deviceId, item.revision]), [['a', 3], ['b', 2], ['c', 1]]);
});
test('a deletion during a snapshot cannot resurrect a device', () => {
 assert.deepEqual(mergeSnapshot([], [device('a')], new Map([['a', 2]]), 1, new Map([['a', 2]])), []);
});
test('a telemetry event for an unknown device does not prevent its snapshot from loading', () => {
 assert.equal(mergeSnapshot([], [device('a', 2)], new Map([['a', 2]]), 1).length, 1);
});
test('old patches cannot roll back state, partial patches do not construct incomplete records', () => {
 const original = [device('a', 3)];
 assert.equal(mergeEvents(original, [{ deviceId: 'a', device: { revision: 2, name: 'old' }, partial: true }]), original);
 assert.equal(mergeEvents([], [{ deviceId: 'b', device: { revision: 2 }, partial: true }]).length, 0);
});
test('unchanged devices keep their references and batched patches preserve full metadata', () => {
 const previous = [device('a'), device('b')];
 const result = mergeEvents(previous, [{ deviceId: 'a', device: { revision: 2, batteryLevel: 50 }, partial: true }]);
 assert.equal(result[0].name, 'a'); assert.equal(result[1], previous[1]);
 assert.equal(mergeSnapshot(previous, [device('a'), device('b')], new Map(), 0), previous);
});
test('a new record incarnation can replace an older record with a higher revision', () => {
 const before = { ...device('a', 10), createdAt: '2026-01-01T00:00:00Z' };
 const after = { ...device('a', 0), createdAt: '2026-02-01T00:00:00Z' };
 assert.equal(mergeEvents([before], [{ deviceId: 'a', device: after }])[0].createdAt, after.createdAt);
});

test('a late deletion for an old record cannot remove its replacement', () => {
 const current = { ...device('a', 0), id: '2' };
 assert.equal(mergeEvents([current], [{ deviceId: 'a', deletedId: '1' }])[0], current);
 assert.equal(mergeSnapshot([], [current], new Map([['a', 2]]), 1, new Map([['a', { sequence: 2, id: '1' }]]))[0], current);
});
test('partial patches from another record incarnation require a full snapshot', () => {
 const current = { ...device('a', 4), id: '1' };
 const previous = [current];
 assert.equal(mergeEvents(previous, [{ deviceId: 'a', partial: true, device: { id: '2', revision: 5, name: 'incomplete' } }]), previous);
 const replacement = { ...device('a', 0), id: '2' };
 assert.equal(mergeEvents(previous, [{ deviceId: 'a', device: replacement }])[0].id, '2');
});
