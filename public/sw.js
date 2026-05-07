// v2 — bump this string on every deploy to force old cache eviction
const CACHE = 'xr-station-v2'

self.addEventListener('install', (event) => {
  // Only pre-cache the bare shell — NOT hashed JS/CSS assets
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html'])))
  self.skipWaiting() // take control immediately without waiting for old SW to die
})

self.addEventListener('activate', (event) => {
  // Delete all old caches (e.g. xr-station-v1)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Vite hashed assets (/assets/*.js, /assets/*.css) — ALWAYS network, never cache.
  // They have content hashes in their filenames so they're self-busting; caching them
  // across deploys is the root cause of the blank-screen bug.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Navigation requests (HTML pages) — network-first, fall back to shell for offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') ?? fetch(event.request)),
    )
    return
  }

  // Everything else (manifest, icons, etc.) — cache-first
  event.respondWith(caches.match(event.request).then((r) => r ?? fetch(event.request)))
})
