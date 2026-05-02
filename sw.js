sw.js
// MYLOVE PWA Service Worker
const CACHE_NAME = 'mylove-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache).catch(function(e){ console.warn('cache failed', e); });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(name) {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  if (url.indexOf('api.gemai.cc') !== -1 || url.indexOf('/v1/chat') !== -1) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(networkResp){
        if (event.request.method === 'GET' && networkResp && networkResp.status === 200) {
          var respClone = networkResp.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, respClone); });
        }
        return networkResp;
      }).catch(function(){ return response; });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    var opts = event.data.options || {};
    self.registration.showNotification(opts.title || 'MYLOVE', {
      body: opts.body || '',
      icon: opts.icon || undefined,
      badge: opts.badge || undefined,
      tag: opts.tag || 'mylove-msg',
      requireInteraction: false
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type:'window'}).then(function(clis){
      for (var i=0; i<clis.length; i++) {
        if ('focus' in clis[i]) return clis[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});

