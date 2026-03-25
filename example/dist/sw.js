var CACHE_NAME = 'canvas-todo-v1';

self.addEventListener('install', function(e) {
  // @ts-ignore
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
       return cache.addAll(['/']);
    })
  );
});

self.addEventListener('activate', function(e) {
  // @ts-ignore
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(e) {
  // @ts-ignore
  e.respondWith(
    fetch((e as any).request).catch(function() {
      return caches.match('/');
    })
  );
});