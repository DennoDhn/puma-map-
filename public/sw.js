// Navigation failures get a public, self-contained page. API responses and
// member pages never enter Cache Storage, even when a session is active.
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (
    req.method !== 'GET' ||
    req.mode !== 'navigate' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  )
    return;
  event.respondWith(
    fetch(req).catch(
      () =>
        new Response(
          '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050609"><title>PumaMap · Offline</title><style>body{background:#050609;color:#f3f6fa;font:1.1rem/1.5 system-ui;margin:0;min-height:100svh;display:grid;place-items:center}main{max-width:32rem;padding:2rem}strong,a{color:#c8ff28}a{display:inline-block;padding:1rem 0}</style><main><strong>PumaMap</strong><h1>Verbindung unterbrochen</h1><p>Sobald du wieder online bist, kannst du deine Garage und die Community öffnen.</p><a href="/">Startseite laden</a></main></html>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
          },
        ),
    ),
  );
});
