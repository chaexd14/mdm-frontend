# MDM dashboard

Static Next.js/React frontend for the Rails API in E:/mdm-backend. All device state, configuration, credentials, commands and events belong to Rails/PostgreSQL.

~~~powershell
npm install
Copy-Item .env.example .env.local
npm run dev
~~~

Set NEXT_PUBLIC_MDM_API_URL to the Rails origin (without /api or a trailing slash), and configure Rails FRONTEND_ORIGINS for the dashboard origin. Start Rails on port 3001. Sign in with its administrator token when authentication is enabled. Tokens remain in browser memory; never put an administrator secret in NEXT_PUBLIC_* variables. This is an administrator API-token sign-in, not individual user accounts or tenant roles.

Register the exact Device ID shown by the APK and enter the returned one-time enrollment code in the device admin screen. Device details can issue a replacement code, rotating the credential when redeemed.

Authenticated streaming fetch carries SSE with Authorization and Last-Event-ID headers; tokens are never placed in stream URLs. The dashboard reconciles snapshots, polls faster while disconnected, and rejects snapshot responses superseded by newer events. Presence uses the same two-minute cutoff as Rails, with separate stale connection quality after one minute. Command history is paginated, counts come from the full queue, and only a device can report execution. Administrators can cancel commands before delivery. Desired and reported configuration versions appear in device details.

Run npx tsc --noEmit and npm run build to validate. The production build exports out/; host that directory or run npm start for local preview. Set the real Rails HTTPS origin before building. No production URL has been selected. The APK must be rebuilt, configured for that Rails API and enrolled; old Vercel telemetry is not automatically imported.

See [the communication rollout guide](../saikotech-android-mdm/docs/production-communication.md) for deployment order and verification.

## Reconciliation and fleet rendering

The dashboard merges per-device revisions, batches live patches, preserves unchanged card references and renders at most 48 devices per page. Device details distinguish connectivity, configuration application, page load and optional app readiness. Reconciliation tests and a Node-only synthetic benchmark are available through npm run test:reconciliation and npm run bench:reconciliation (Node 24). See [readiness and performance rollout](../saikotech-android-mdm/docs/readiness-and-performance.md).
