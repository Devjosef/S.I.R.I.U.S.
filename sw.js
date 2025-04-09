const CACHE_NAME = 'sirius-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/trello.svg',
  '/icons/notion.svg',
  '/icons/google-calendar.svg',
  '/icons/pinecone.svg',
  '/icons/openai.svg',
  '/icons/sirius-icon-192.png',
  '/icons/sirius-icon-512.png'
];

// Cache version management
const DYNAMIC_CACHE = 'sirius-dynamic-v1';
const API_CACHE = 'sirius-api-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
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
                cacheName !== API_CACHE) {
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
  return url.pathname.startsWith('/create-trello-board') || 
         url.pathname.startsWith('/create-notion-template') ||
         url.pathname.startsWith('/create-calendar-event') ||
         url.pathname.startsWith('/store-embedding') ||
         url.pathname.startsWith('/query-embedding');
};

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !isApiRequest(event.request)) {
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
  if (event.tag === 'sync-pinecone-operations') {
    event.waitUntil(syncPendingPineconeOperations());
  } else if (event.tag === 'sync-trello-operations') {
    event.waitUntil(syncPendingTrelloOperations());
  } else if (event.tag === 'sync-notion-operations') {
    event.waitUntil(syncPendingNotionOperations());
  } else if (event.tag === 'sync-calendar-operations') {
    event.waitUntil(syncPendingCalendarOperations());
  }
});

// Helper to sync pending operations (implementation would use IndexedDB)
async function syncPendingPineconeOperations() {
  // Retrieve pending operations from IndexedDB
  // For each operation, try to send it to the server
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

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body || 'New notification from SIRIUS',
    icon: '/icons/sirius-icon-192.png',
    badge: '/icons/sirius-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now(),
      source: data.source || 'sirius'
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SIRIUS Productivity System', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const source = event.notification.data.source;
    let url = '/';

    // Direct to appropriate page based on notification source
    if (source === 'trello') {
      url = '/trello-dashboard';
    } else if (source === 'notion') {
      url = '/notion-dashboard';
    } else if (source === 'calendar') {
      url = '/calendar-dashboard';
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