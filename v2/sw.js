/*
  Hontori v2 service worker: keeps the whole game on the device so it starts and plays with no internet.

  tools/build_release_v2.js writes the two values below into dist2/sw.js: the build version (part of the
  cache name) and the complete list of files of that build.

  A release (FILES is filled in):
    install    every file of the build is stored under the cache 'hontori2-<version>'. If one file cannot
               be fetched, the install fails and the version already on the device stays in charge.
    fetch      files come from that cache first; the network is only asked for something not in it.
    update     a new version is fetched in the background while the player keeps playing the one they
               started with. It takes over the next time the game is opened, never under the player:
               there is no skipWaiting and no reload.
    activate   caches of older versions are removed.

  Development (this file as it sits in the project root, FILES empty): the network is asked first, so a
  change is always seen at once; what was fetched is kept and used only when the network is unreachable.

  Pages opened with ?debug=1 or ?nosw=1 always go to the network.
*/
'use strict';
var VERSION = 'dev';
var FILES = [];
var CACHE = 'hontori2-' + VERSION;
var RELEASE = FILES.length > 0;

function storeAll(cache) {
  /* a few at a time, each one fresh from the server (never a stale copy from the browser's own cache) */
  var i = 0;
  function worker() {
    if (i >= FILES.length) return Promise.resolve();
    var url = FILES[i++];
    return fetch(new Request(url, { cache: 'no-cache' })).then(function (res) {
      if (!res || !res.ok) throw new Error('could not fetch ' + url);
      return cache.put(url, res);
    }).then(worker);
  }
  var lanes = [];
  for (var n = 0; n < 6; n++) lanes.push(worker());
  return Promise.all(lanes);
}

self.addEventListener('install', function (event) {
  if (!RELEASE) { self.skipWaiting(); return; }
  event.waitUntil(caches.open(CACHE).then(storeAll));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return /^hontori2-/.test(k) && k !== CACHE ? caches.delete(k) : null; }));
  }).then(function () { return self.clients.claim(); }));
});

function isDebug(request) {
  var flag = /[?&](debug|nosw)=1/;
  return flag.test(request.url) || flag.test(request.referrer || '');
}

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    var key = request.mode === 'navigate' ? 'index.html' : request;
    return cache.match(key, { ignoreSearch: true }).then(function (hit) { return hit || fetch(request); });
  });
}

function networkFirst(request) {
  return fetch(request).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (cache) { return cache.put(request, copy); }).catch(function () {}); }
    return res;
  }).catch(function () {
    return caches.open(CACHE).then(function (cache) { return cache.match(request, { ignoreSearch: request.mode === 'navigate' }); }).then(function (hit) {
      if (hit) return hit;
      throw new Error('offline and not stored: ' + request.url);
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (request.url.indexOf(self.location.origin + '/') !== 0) return;
  if (isDebug(request)) return;
  event.respondWith(RELEASE ? fromCache(request) : networkFirst(request));
});
