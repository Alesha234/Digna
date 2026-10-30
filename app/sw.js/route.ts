/** The app's offline page (Ignesis shell): a service worker that stores nothing and answers only when the device is offline. */
const WORKER = `
const PAGE = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title></head>' +
  '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fff;color:#111">' +
  '<main style="text-align:center;padding:24px"><h1 style="font-size:22px;font-weight:600">You&#39;re offline</h1><p>Check your connection, then try again.</p>' +
  '<button onclick="location.reload()" style="font:inherit;padding:10px 18px;border-radius:999px;border:0;background:#111;color:#fff">Try again</button></main></body></html>';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
});
`;

export function GET() {
  return new Response(WORKER, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache" } });
}
