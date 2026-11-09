// Service worker minimale: app utilizzabile anche offline.
// HTML: prima la rete (per ricevere gli aggiornamenti), poi la cache.
// Asset (con hash nel nome): prima la cache.
const CACHE = 'beauty-case-v1'
const INDEX = new URL('./', self.location).href

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  const store = (response) => {
    if (response.ok) {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(request, copy))
    }
    return response
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(store)
        .catch(() => caches.match(request).then((r) => r || caches.match(INDEX))),
    )
    return
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then(store)))
})
