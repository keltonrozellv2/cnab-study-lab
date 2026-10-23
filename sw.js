/* CNAB Study Lab service worker — offline cache + silent background update */
const VERSION = "v53";
const CACHE = "cnab-" + VERSION;
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* strategy: serve from cache immediately (so it works offline), refresh the cache from the network in the background */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // fonts etc. go straight to network, fail gracefully offline
  const isShell = e.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/");
  if (isShell) {
    // network-first with a short timeout: fresh when online, instant from cache when offline
    e.respondWith(new Promise(resolve => {
      let done = false; const t = setTimeout(() => { if (!done) caches.match("./index.html").then(c => { done = true; resolve(c || fetch(e.request)); }); }, 2500);
      fetch(e.request).then(res => { clearTimeout(t); if (done) return; done = true; if (res && res.ok) caches.open(CACHE).then(c => c.put("./index.html", res.clone())); resolve(res); })
        .catch(() => { clearTimeout(t); if (done) return; done = true; caches.match("./index.html").then(c => resolve(c || Response.error())); });
    }));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const net = fetch(e.request).then(res => { if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; }).catch(() => cached);
      return cached || net;
    })
  );
});
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
