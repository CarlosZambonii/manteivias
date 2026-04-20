/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  if (event.data && event.data.type) {
    const { title, message, data } = event.data;
    if (title && message) {
      const options = {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data || {},
        vibrate: [100, 50, 100]
      };
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    }
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[Service Worker] Push event received but no data payload found.');
    return;
  }

  try {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Alerta', message: event.data.text() };
    }

    const title = data.title || 'Sistema de Ponto';
    const options = {
      body: data.message || 'Nova notificação do sistema',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data || {},
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Abrir App' }
      ],
      requireInteraction: true
    };

    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          payload: data
        });
      });
    });

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    console.error('[Service Worker] Error processing push event:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      
      if (self.clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/';
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  if (event.tag === 'sync-records') {
    // Placeholder for background sync implementation
    event.waitUntil(Promise.resolve());
  }
});