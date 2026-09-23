// CampusBridge Service Worker for Web Push Notifications

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  let data = {
    title: 'CampusBridge',
    body: 'You have a new update.',
    url: '/dashboard',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const isCall = data.tag && data.tag.includes('call');

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    vibrate: isCall ? [300, 100, 300, 100, 300, 100, 400] : [200, 100, 200],
    tag: data.tag || ('cb-notif-' + Date.now()),
    renotify: true,
    requireInteraction: isCall ? true : false,
    data: {
      url: data.url || '/dashboard',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'View' }
    ]
  };

  // Broadcast to open client tabs so active windows play notification sound if enabled
  const broadcastSound = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    for (let i = 0; i < clientList.length; i++) {
      clientList[i].postMessage({
        type: 'CAMPUSBRIDGE_PLAY_NOTIFICATION_SOUND',
        data: data
      });
    }
  }).catch(function(err) {
    console.debug('SW broadcast sound error:', err);
  });

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'CampusBridge', options),
      broadcastSound
    ])
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
