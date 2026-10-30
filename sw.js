// VE OJT/EV pre-information form – offline cache. Bump VERSION whenever index.html changes.
var VERSION = 've-ojt-v2.3.0';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                   // submissions go straight to the network
  if (url.hostname.indexOf('script.google') >= 0 || url.hostname.indexOf('googleusercontent') >= 0) return;
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(req, { ignoreSearch: !isFont }).then(function (hit) {
      var net = fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; })
        .catch(function () { return hit || (req.mode === 'navigate' ? c.match('./index.html') : undefined); });
      return hit || net;                                              // cache first, refresh in background
    });
  }));
});
