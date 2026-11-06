'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, subscribeEvents } from '@/lib/api';
import type { Device } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
interface Release { id: string; versionName: string; versionCode: number; minSdk: number; abis: string[]; sha256: string; signerSha256: string; byteSize: number; notes: string; state: string; debugBuild: boolean; requireAppReady: boolean }
interface Assignment { id: string; deviceId: string; policy: string; desiredState: string; attemptNumber: number; release: Release; attempt: { state: string; progress: number; errorMessage?: string; installedVersionCode?: number; lastReportedAt?: string } }
export function AppReleasesPanel({ open, onClose, devices }: { open: boolean; onClose: () => void; devices: Device[] }) {
  const [releases, setReleases] = useState<Release[]>([]), [updates, setUpdates] = useState<Assignment[]>([]);
  const [file, setFile] = useState<File | null>(null), [notes, setNotes] = useState(''), [requireReady, setRequireReady] = useState(false);
  const [selected, setSelected] = useState(''), [ids, setIds] = useState(''), [policy, setPolicy] = useState('approval');
  const [start, setStart] = useState(''), [end, setEnd] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const res = await apiFetch('/api/app-releases'); const body = await res.json(); if (!res.ok || !body.success) throw new Error(body.error || 'Cannot load app releases'); setReleases(body.data.releases); setUpdates(body.data.updates); }
    catch (problem) { setError(problem instanceof Error ? problem.message : String(problem)); }
  }, []);
  useEffect(() => {
    if (!open) return;
    const initial = setTimeout(() => { void load(); }, 0); let timer: ReturnType<typeof setTimeout> | null = null;
    const stream = subscribeEvents(type => { if (['release_updated', 'update_progress'].includes(type) && !timer) timer = setTimeout(() => { timer = null; void load(); }, 300); }, () => {});
    const fallback = setInterval(load, 15000);
    return () => { stream.close(); clearTimeout(initial); clearInterval(fallback); if (timer) clearTimeout(timer); };
  }, [open, load]);
  const request = async (path: string, method: string, data: object) => {
    const res = await apiFetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json(); if (!res.ok || !result.success) throw new Error(result.error || 'Update action failed'); return result.data;
  };
  const perform = async (operation: () => Promise<void>) => { setBusy(true); setError(''); try { await operation(); await load(); } catch (problem) { setError(problem instanceof Error ? problem.message : String(problem)); } finally { setBusy(false); } };
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle>App software releases</DialogTitle><DialogDescription>Publish signed APK updates, start with pilot devices, and confirm installed versions before expanding the rollout.</DialogDescription></DialogHeader>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <form className="border rounded-lg p-4 space-y-3" onSubmit={event => { event.preventDefault(); void perform(async () => {
      if (!file) throw new Error('Select a signed universal APK');
      if (file.size > 300 * 1024 * 1024) throw new Error('APK exceeds 300 MB');
      const form = new FormData(); form.append('apk', file); form.append('notes', notes); form.append('requireAppReady', String(requireReady));
      const res = await apiFetch('/api/app-releases', { method: 'POST', body: form, signal: AbortSignal.timeout(300000) });
      const result = await res.json(); if (!res.ok || !result.success) throw new Error(result.error || 'APK verification failed');
      setSelected(result.data.id); setFile(null); setNotes('');
    }); }}>
      <h3 className="font-semibold">Upload and verify a release</h3>
      <input aria-label="Signed APK file" type="file" accept=".apk" disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} />
      <textarea aria-label="Release notes" className="w-full border rounded p-2 text-sm" placeholder="Release notes" value={notes} maxLength={5000} onChange={event => setNotes(event.target.value)} />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={requireReady} onChange={event => setRequireReady(event.target.checked)} />Require the hosted app&apos;s optional ready signal for health confirmation</label>
      <Button type="submit" disabled={busy || !file}>{busy ? 'Processing…' : 'Upload and verify APK'}</Button>
      <p className="text-xs text-muted-foreground">Version, compatibility, checksum and signer are inspected on the server. Signing keys never belong in this form.</p>
    </form>
    <section className="space-y-2"><h3 className="font-semibold">Releases</h3>{releases.length === 0 && <p className="text-sm text-muted-foreground">No releases uploaded.</p>}
      {releases.map(release => <article key={release.id} className="border rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between flex-wrap gap-2"><strong>{release.versionName} · code {release.versionCode} · {release.state}</strong><span>{(release.byteSize / 1048576).toFixed(1)} MB · Android API {release.minSdk}+</span></div>
        <p>{release.notes}</p><p className="text-xs text-muted-foreground break-all">Signer SHA-256: {release.signerSha256}</p>
        {release.debugBuild && <p className="text-destructive text-xs">Development signing/build detected. Production publication will be rejected.</p>}
        <div className="flex flex-wrap gap-2">
          {['draft', 'paused'].includes(release.state) && <Button size="sm" disabled={busy} onClick={() => perform(async () => { await request('/api/app-releases/' + release.id, 'PATCH', { state: 'published' }); })}>Publish / resume</Button>}
          {release.state === 'published' && <Button size="sm" variant="outline" disabled={busy} onClick={() => perform(async () => { await request('/api/app-releases/' + release.id, 'PATCH', { state: 'paused' }); })}>Pause rollout</Button>}
          {release.state !== 'revoked' && <Button size="sm" variant="destructive" disabled={busy} onClick={() => { if (window.confirm('Revoke this release? New downloads and install authorizations will be blocked; committed installations cannot be recalled.')) void perform(async () => { await request('/api/app-releases/' + release.id, 'PATCH', { state: 'revoked' }); }); }}>Revoke</Button>}
        </div>
      </article>)}
    </section>
    <form className="border rounded-lg p-4 space-y-3" onSubmit={event => { event.preventDefault(); void perform(async () => {
      const deviceIds = [...new Set(ids.split(/[\s,]+/).map(value => value.trim().toUpperCase()).filter(Boolean))];
      if (!selected || !deviceIds.length) throw new Error('Choose a published release and at least one device');
      const payload = { deviceIds, policy, ...(policy === 'automatic' ? { notBefore: new Date(start).toISOString(), windowEnd: new Date(end).toISOString() } : {}) };
      await request('/api/app-releases/' + selected + '/assign', 'POST', payload);
    }); }}>
      <h3 className="font-semibold">Assign to pilot devices or fleet</h3>
      <select aria-label="Published release" className="border rounded p-2 w-full" value={selected} onChange={event => setSelected(event.target.value)}><option value="">Select a published release</option>{releases.filter(release => release.state === 'published').map(release => <option key={release.id} value={release.id}>{release.versionName} ({release.versionCode})</option>)}</select>
      <textarea aria-label="Target device IDs" className="border rounded p-2 w-full text-sm" placeholder="Device IDs separated by commas or new lines" value={ids} onChange={event => setIds(event.target.value)} />
      <Button type="button" size="sm" variant="outline" onClick={() => setIds(devices.slice(0, 2).map(device => device.deviceId).join(', '))}>Select first two devices as pilot</Button>
      <select aria-label="Installation policy" className="border rounded p-2 w-full" value={policy} onChange={event => setPolicy(event.target.value)}><option value="approval">Download, then require staff approval</option><option value="automatic">Managed automatic installation in a maintenance window</option></select>
      {policy === 'automatic' && <div className="space-y-2 text-sm"><p>Device Owner is required. Times are entered in your browser&apos;s local timezone and sent as UTC. Avoid active customer workflows.</p><label className="block">Window starts <input required type="datetime-local" value={start} onChange={event => setStart(event.target.value)} /></label><label className="block">Window ends <input required type="datetime-local" value={end} onChange={event => setEnd(event.target.value)} /></label></div>}
      <Button disabled={busy || !selected || !ids.trim()} type="submit">Assign update</Button>
    </form>
    <section className="space-y-2"><div className="flex justify-between"><h3 className="font-semibold">Recent device update attempts</h3><Button size="sm" variant="outline" onClick={load}>Refresh</Button></div>
      {updates.map(update => <article key={update.id} className="border rounded p-3 text-sm space-y-1"><strong>{update.deviceId} · {update.release.versionName}</strong><p>{update.attempt.state.replace(/_/g, ' ')} · {update.attempt.progress}% · attempt {update.attemptNumber}</p>
        {update.attempt.installedVersionCode != null && <p>Reported installed code: {update.attempt.installedVersionCode}</p>}
        {update.attempt.errorMessage && <p className="text-destructive">{update.attempt.errorMessage}</p>}
        <div className="flex gap-2">{['failed', 'cancelled', 'superseded'].includes(update.attempt.state) && <Button size="sm" variant="outline" disabled={busy} onClick={() => perform(async () => { await request('/api/device-updates/' + update.id + '/control', 'POST', { actionType: 'retry' }); })}>Retry with new attempt</Button>}
        {update.desiredState === 'active' && !['installing', 'awaiting_system_approval', 'installed', 'confirmed'].includes(update.attempt.state) && <Button size="sm" variant="outline" disabled={busy} onClick={() => perform(async () => { await request('/api/device-updates/' + update.id + '/control', 'POST', { actionType: 'cancel' }); })}>Cancel before installation</Button>}</div>
      </article>)}
    </section>
  </DialogContent></Dialog>;
}
