/* Service worker: red primero (actualiza solo cuando hay internet), caché como respaldo offline. */
const CACHE = "asesor-electrico-v0.5.1";
const ASSETS = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./sync.js",
  "./config.js",
  "./data-ric04.js",
  "./calc.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Supabase / IA: siempre a la red, nunca se cachea.
  if (url.hostname.endsWith("supabase.co") || url.pathname.includes("/functions/")) return;

  // Solo gestionamos nuestro propio origen.
  if (url.origin !== self.location.origin) return;

  // Red primero: trae lo último si hay internet; si falla, usa la caché (offline).
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
