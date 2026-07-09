// Service Worker — 离线缓存 + PWA 支持
const CACHE = 'ai-guide-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        '/',
        '/tourist',
        '/admin',
        '/index.html',
        '/manifest.json',
      ])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  // API 请求走网络
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request))
    return
  }
  // 只缓存 GET 请求（POST 等不能被 Cache API 缓存）
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((resp) => {
      if (resp.ok) {
        const clone = resp.clone()
        caches.open(CACHE).then((cache) => cache.put(e.request, clone))
      }
      return resp
    }))
  )
})
