const n = new Date();
const activeCache = 'api-v' + n.getFullYear() + n.getMonth() + n.getDate() + n.getHours();

self.addEventListener('activate', (event) => {
    console.log('Activate event recieved');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName != activeCache) {
                        console.log('Scrubbing old API cache entry: ', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith('https://dl-api.oddconcepts.kr') ||
        ((event.request.url.endsWith('.jpg') || event.request.url.endsWith('.png')) && event.request.url.startsWith('https'))) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return caches.open(activeCache).then((cache) => {
                    return fetch(event.request).then((response) => {
                        if (event.request.method === 'GET') {
                            return cache.put(event.request, response.clone()).then(() => {
                                return response;
                            });
                        }
                        else {
                            return response;
                        }
                    });
                });
            })
        );
    }
});
