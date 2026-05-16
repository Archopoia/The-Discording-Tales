/**
 * TDT offline-friendly cache: same-origin /assets/ and /dist/ only.
 * Stale-while-revalidate: fast repeat visits; background refresh.
 * Does not intercept navigations (HTML always from network).
 * Bump CACHE_NAME after changing caching rules.
 */
/* global self, caches, fetch */
var CACHE_NAME = 'tdt-static-v4';

function isAssetRequest(url) {
    var p = url.pathname;
    return p.indexOf('/assets/') !== -1 || p.indexOf('/dist/') !== -1;
}

self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys
                    .filter(function(k) {
                        return k !== CACHE_NAME && k.indexOf('tdt-static-') === 0;
                    })
                    .map(function(k) {
                        return caches.delete(k);
                    })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var req = event.request;
    if (req.method !== 'GET') return;
    if (req.mode === 'navigate') return;

    var url;
    try {
        url = new URL(req.url);
    } catch (e) {
        return;
    }
    if (url.origin !== self.location.origin) return;
    if (!isAssetRequest(url)) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.match(req).then(function(cached) {
                var networkPromise = fetch(req)
                    .then(function(res) {
                        if (res && res.ok) {
                            try {
                                cache.put(req, res.clone());
                            } catch (e) { /* ignore */ }
                        }
                        return res;
                    })
                    .catch(function() {
                        return null;
                    });

                if (cached) {
                    event.waitUntil(networkPromise);
                    return cached;
                }
                return networkPromise.then(function(res) {
                    if (res) return res;
                    return cached;
                });
            });
        })
    );
});
