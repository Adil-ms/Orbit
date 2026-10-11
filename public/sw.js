// ORBIT service worker — only handles push notifications (trip reminders and checklist updates).
// It deliberately does no caching, so it never serves stale app files.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'ORBIT', {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag, // a newer reminder for the same trip replaces the older one
      renotify: Boolean(data.tag),
      data: { url: data.url || '/trips' },
    }),
  )
})

// Tapping the notification focuses an open ORBIT tab (navigating it to the trip) or opens a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/trips', self.location.origin)
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const same = tabs.find((c) => new URL(c.url).origin === url.origin)
      if (same && url.origin === self.location.origin) {
        await same.focus()
        return same.navigate(url.href)
      }
      return self.clients.openWindow(url.href)
    })(),
  )
})
