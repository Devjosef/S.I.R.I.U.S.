const CACHE_NAME = 'sirius-neural-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/trello.svg',
  '/icons/notion.svg',
  '/icons/google-calendar.svg',
  '/icons/pinecone.svg',
  '/icons/sirius-icon-192.png',
  '/icons/sirius-icon-512.png'
];

// Cache version management
const DYNAMIC_CACHE = 'sirius-dynamic-v2';
const API_CACHE = 'sirius-api-v2';
const NEURAL_CACHE = 'sirius-neural-assets-v2';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(NEURAL_CACHE).then(cache => {
        // Cache neural network assets
        return cache.addAll([
          'https://unpkg.com/htmx.org@1.9.10',
          'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js'
        ]);
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE &&
                cacheName !== NEURAL_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Helper to determine API requests
const isApiRequest = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.pathname.startsWith('/create-trello-board') || 
         url.pathname.startsWith('/create-notion-template') ||
         url.pathname.startsWith('/create-calendar-event') ||
         url.pathname.startsWith('/store-embedding') ||
         url.pathname.startsWith('/query-embedding');
};

// Helper to determine neural network assets
const isNeuralAsset = (request) => {
  const url = new URL(request.url);
  return url.href.includes('htmx.org') || 
         url.href.includes('alpinejs') ||
         url.pathname.includes('neural');
};

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that aren't neural assets
  if (!event.request.url.startsWith(self.location.origin) && 
      !isApiRequest(event.request) &&
      !isNeuralAsset(event.request)) {
    return;
  }

  // Strategy for neural network assets (Cache first, fall back to network)
  if (isNeuralAsset(event.request)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(fetchResponse => {
              if (!fetchResponse || fetchResponse.status !== 200) {
                return fetchResponse;
              }
              const responseToCache = fetchResponse.clone();
              caches.open(NEURAL_CACHE)
                .then(cache => cache.put(event.request, responseToCache));
              return fetchResponse;
            });
        })
    );
    return;
  }

  // Strategy for API requests (Network first, fall back to cache)
  if (isApiRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(API_CACHE)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy for static assets (Cache first, fall back to network)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(fetchResponse => {
            // Don't cache non-successful responses
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            const responseToCache = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          });
      })
      .catch(() => {
        // Fallback for offline HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-neural-operations') {
    event.waitUntil(syncPendingNeuralOperations());
  } else if (event.tag === 'sync-pinecone-operations') {
    event.waitUntil(syncPendingPineconeOperations());
  } else if (event.tag === 'sync-trello-operations') {
    event.waitUntil(syncPendingTrelloOperations());
  } else if (event.tag === 'sync-notion-operations') {
    event.waitUntil(syncPendingNotionOperations());
  } else if (event.tag === 'sync-calendar-operations') {
    event.waitUntil(syncPendingCalendarOperations());
  }
});

// Helper to sync pending neural operations
async function syncPendingNeuralOperations() {
  console.log('Syncing pending neural network operations...');
  // Sync any pending neural network state changes
}

async function syncPendingPineconeOperations() {
  console.log('Syncing pending Pinecone operations...');
}

async function syncPendingTrelloOperations() {
  console.log('Syncing pending Trello operations...');
}

async function syncPendingNotionOperations() {
  console.log('Syncing pending Notion operations...');
}

async function syncPendingCalendarOperations() {
  console.log('Syncing pending Calendar operations...');
}

// Push notification handling with neural network theme
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Neural network activity detected',
    icon: '/icons/sirius-icon-192.png',
    badge: '/icons/sirius-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now(),
      source: data.source || 'neural-core',
      type: data.type || 'system'
    },
    actions: data.actions || [
      { action: 'view', title: 'View Neural Activity' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'sirius-neural',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'S.I.R.I.U.S. Neural Network', 
      options
    )
  );
});

// Handle notification clicks with neural network routing
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const source = event.notification.data.source;
    let url = '/';

    // Direct to appropriate neural network section
    if (source === 'daily-digest') {
      url = '/?action=daily-digest';
    } else if (source === 'context-analysis') {
      url = '/?action=context';
    } else if (source === 'autonomous-action') {
      url = '/?action=autonomous';
    } else if (source === 'memory-insights') {
      url = '/?action=memory';
    } else if (source === 'neural-core') {
      url = '/?action=neural-status';
    }

    event.waitUntil(
      clients.matchAll({type: 'window'})
        .then(windowClients => {
          // Check if there is already a window/tab open with the target URL
          for (let client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window/tab is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Handle neural network message events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NEURAL_ACTIVITY') {
    // Handle neural network activity updates
    console.log('Neural activity detected:', event.data.activity);
    
    // Broadcast to all clients
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEURAL_UPDATE',
            data: event.data.activity
          });
        });
      })
    );
  }
});