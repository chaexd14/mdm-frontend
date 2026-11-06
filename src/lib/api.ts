const API_ORIGIN = (process.env.NEXT_PUBLIC_MDM_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
let accessToken = '';
export function setAccessToken(token: string) { accessToken = token; }
export function apiUrl(path: string) { return API_ORIGIN + (path.startsWith('/') ? path : '/' + path); }
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', 'Bearer ' + accessToken);
  if (options.method === 'POST' && /\/commands$/.test(path) && !headers.has('Idempotency-Key')) headers.set('Idempotency-Key', crypto.randomUUID());
  const res = await fetch(apiUrl(path), { ...options, headers, cache: 'no-store', signal: options.signal || AbortSignal.timeout(15000) });
  if (res.status === 401 && path !== '/api/auth') window.dispatchEvent(new Event('mdm-auth-required'));
  return res;
}

// Fetch streaming supports Authorization headers without putting credentials in URLs.
export function subscribeEvents(onEvent: (type: string, data: string) => void, onState: (connected: boolean) => void) {
  const controller = new AbortController();
  let cursor = '';
  let attempt = 0;
  const run = async () => {
    while (!controller.signal.aborted) {
      const connection = new AbortController();
      const watchdog = setTimeout(() => connection.abort(), 45000);
      try {
        const res = await apiFetch('/api/devices/events', { signal: AbortSignal.any([controller.signal, connection.signal]), headers: cursor ? { 'Last-Event-ID': cursor } : {} });
        if (!res.ok || !res.body) throw new Error('Event stream unavailable');
        const reader = res.body.getReader();
        const decoder = new TextDecoder(); let buffer = '';
        try {
          while (!controller.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');
            let end: number;
            while ((end = buffer.indexOf('\n\n')) >= 0) {
              const block = buffer.slice(0, end); buffer = buffer.slice(end + 2);
              let type = 'message'; const data: string[] = [];
              for (const line of block.split('\n')) {
                if (line.startsWith('id:')) cursor = line.slice(3).trim();
                if (line.startsWith('event:')) type = line.slice(6).trim();
                if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
              }
              if (data.length) { onState(true); attempt = 0; onEvent(type, data.join('\n')); }
            }
          }
        } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      } catch { if (controller.signal.aborted) break; }
      finally { clearTimeout(watchdog); }
      onState(false);
      const delay = Math.max(500, Math.random() * Math.min(30000, 1000 * 2 ** Math.min(attempt++, 5)));
      await new Promise<void>(resolve => {
        const finish = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', finish); resolve(); };
        const timer = setTimeout(finish, delay); controller.signal.addEventListener('abort', finish, { once: true });
      });
    }
  };
  void run();
  return { close: () => controller.abort() };
}
