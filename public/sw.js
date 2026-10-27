/* Brew Card offline support.
   Pages: network first, falling back to the cached copy (so recipes you've opened work offline).
   Build assets (/_next/static, fonts, icons): cache first — their names change when they change. */
const VERSION = "brewcard-v1";
const PRECACHE = ["/", "/guides/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const immutable = url.pathname.startsWith("/_next/static/") || /\.(woff2?|png|svg|webmanifest)$/.test(url.pathname);
  if (immutable) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // pages and the data Next.js fetches when you move between them
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: req.mode !== "navigate" ? false : true }).then((hit) =>
        hit || (req.mode === "navigate" ? caches.match("/") : Response.error())
      )
    )
  );
});
