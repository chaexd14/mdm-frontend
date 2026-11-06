'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { apiFetch, setAccessToken } from '@/lib/api';

export function ApiAccess({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiFetch('/api/auth').then(res => { if (active) setReady(res.ok); })
      .catch(() => { if (active) setError('Cannot reach the MDM API. Check the API URL and network.'); })
      .finally(() => { if (active) setChecking(false); });
    const reset = () => { setAccessToken(''); setReady(false); setError('Please sign in to the MDM API.'); };
    window.addEventListener('mdm-auth-required', reset);
    return () => { active = false; window.removeEventListener('mdm-auth-required', reset); };
  }, []);
  if (checking) return <main className="m-auto p-8">Connecting to fleet management…</main>;
  if (ready) return <><div className="px-6 py-2 text-right"><button className="text-xs underline" onClick={() => { setAccessToken(''); setReady(false); }}>Sign out</button></div>{children}</>;
  return <main className="m-auto max-w-md p-8 space-y-4"><h1 className="text-xl font-semibold">Fleet management sign in</h1>
    <p className="text-sm text-muted-foreground">Enter the administrator access token supplied by your deployment administrator.</p>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); setChecking(true); setError(''); setAccessToken(token.trim());
      try { const res = await apiFetch('/api/auth'); if (!res.ok) throw new Error('Invalid administrator token'); setReady(true); setToken(''); }
      catch (err) { setAccessToken(''); setError(err instanceof Error ? err.message : 'Sign in failed'); }
      finally { setChecking(false); }
    }}><label className="block text-sm">Administrator token<input className="block w-full border rounded p-2 mt-2" type="password" autoComplete="off" required value={token} onChange={event => setToken(event.target.value)} /></label>
    <button className="border rounded px-4 py-2" type="submit">Sign in</button></form>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </main>;
}
