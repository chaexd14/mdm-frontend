'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Activity, ArrowRight, Eye, EyeOff, LoaderCircle, LogOut, Monitor, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminUser = { username: string };

export function ApiAccess({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const restore = async () => {
      try {
        const res = await apiFetch('/api/auth', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        const body = await res.json();
        if (controller.signal.aborted) return;
        if (res.ok && body.success) setUser(body.data.user);
        else if (res.status !== 401) setError(body.error || 'Cannot check your session. Please try again.');
      } catch {
        if (!controller.signal.aborted) setError('Cannot reach the dashboard service. Check your connection and try again.');
      } finally { if (!controller.signal.aborted) setInitializing(false); }
    };
    void restore();
    const reset = () => { setUser(null); setPassword(''); setError('Your session has expired. Please sign in again.'); };
    window.addEventListener('mdm-auth-required', reset);
    return () => { controller.abort(); window.removeEventListener('mdm-auth-required', reset); };
  }, []);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Sign in failed. Please try again.');
      // Verify that the browser accepted the HTTP-only session cookie before opening the fleet.
      const check = await apiFetch('/api/auth');
      if (!check.ok) throw new Error('Your session could not be saved. Check your browser cookie settings and try again.');
      setUser(body.data.user); setPassword(''); setShowPassword(false);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Cannot sign in. Please try again.'); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/auth/session', { method: 'DELETE' });
      if (!res.ok) throw new Error('Cannot sign out right now. Please try again.');
      setUser(null); setPassword('');
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Cannot sign out. Please try again.'); }
    finally { setBusy(false); }
  };

  if (initializing) return <main className="min-h-svh flex items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" /><p role="status">Opening SaikoTech dashboard…</p></main>;

  if (user) return <>
    <div className="border-b border-border bg-muted/40 px-4 py-2 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 text-sm">
        {error && <p role="alert" className="mr-auto text-destructive">{error}</p>}
        <span className="text-muted-foreground">{user.username}</span>
        <Button variant="ghost" size="sm" disabled={busy} onClick={signOut}><LogOut aria-hidden="true" />{busy ? 'Signing out…' : 'Sign out'}</Button>
      </div>
    </div>
    {children}
  </>;

  return <main className="min-h-svh w-full bg-muted/40 p-4 flex items-center justify-center sm:p-8">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:grid-cols-2">
      <section className="relative flex flex-col justify-between gap-10 bg-primary px-7 py-8 text-primary-foreground sm:px-10 sm:py-12">
        <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl border border-primary-foreground/25 bg-primary-foreground/10"><Monitor className="size-6" aria-hidden="true" /></div><div><p className="text-xl font-bold tracking-tight">SaikoTech</p><p className="text-xs tracking-wide text-primary-foreground/80">ANDROID MDM</p></div></div>
        <div className="space-y-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">Fleet management</p><h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Your devices.<br />One connected workspace.</h1><p className="max-w-sm text-sm leading-6 text-primary-foreground/85">Monitor your fleet, manage devices, and keep every screen running smoothly.</p></div>
        <div className="hidden space-y-3 border-t border-primary-foreground/20 pt-6 text-sm md:block"><p className="flex items-center gap-3"><Activity className="size-4" aria-hidden="true" />Live device monitoring</p><p className="flex items-center gap-3"><ShieldCheck className="size-4" aria-hidden="true" />Centralized device management</p></div>
      </section>
      <section className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14" aria-labelledby="login-heading">
        <div className="mb-8"><div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-6" aria-hidden="true" /></div><h2 id="login-heading" className="text-2xl font-semibold tracking-tight">Welcome back</h2><p className="mt-2 text-sm text-muted-foreground">Sign in to your SaikoTech dashboard.</p></div>
        <form onSubmit={signIn} className="space-y-5" aria-busy={busy}>
          <div className="space-y-2"><label htmlFor="admin-username" className="text-sm font-medium">Username</label><Input id="admin-username" name="username" className="h-11" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={80} disabled={busy} value={username} onChange={event => setUsername(event.target.value)} placeholder="Enter your username" /></div>
          <div className="space-y-2"><label htmlFor="admin-password" className="text-sm font-medium">Password</label><div className="relative"><Input id="admin-password" name="password" className="h-11 pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          <Button className="h-11 w-full" type="submit" disabled={busy}>{busy ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Signing in…</> : <>Sign in<ArrowRight aria-hidden="true" /></>}</Button>
        </form>
        <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">SaikoTech Solutions · Device Fleet Management &amp; Live Monitoring</p>
      </section>
    </div>
  </main>;
}
