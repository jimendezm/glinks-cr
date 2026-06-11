const CACHE_NAME = 'glinks-cache-v1';
const API_CACHE_NAME = 'glinks-api-v1';

const urlsToCache = [
  '/',
  '/index.html'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Error en cache:', err))
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // NO interceptar peticiones al servidor de desarrollo de Vite
  if (url.port === '5173' || url.hostname === 'localhost') {
    // Dejar pasar las peticiones de desarrollo sin interceptar
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Solo interceptar peticiones a la API en producción
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Para peticiones estáticas en producción
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => {
        // Si hay error y es una navegación, mostrar offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// Manejar peticiones API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Solo cachear GET requests en producción
  if (request.method === 'GET') {
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Actualizar cache en segundo plano
        fetch(request).then(response => {
          if (response.ok) {
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, response);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      
      const response = await fetch(request);
      if (response.ok) {
        const responseToCache = response.clone();
        caches.open(API_CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    } catch (error) {
      console.log('API offline, buscando en cache');
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // POST, PUT, DELETE - pasar directamente
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('Error en petición:', error);
    return new Response(JSON.stringify({ 
      error: 'Sin conexión al servidor',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}