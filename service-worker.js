// service-worker.js

// Nombre de la caché para nuestra aplicación
const CACHE_NAME = 'mental-coach-ai-v1.5.1'; // Versión actualizada para forzar la actualización

// Archivos y recursos que queremos guardar en la caché con rutas relativas
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  // ===== RUTAS CORREGIDAS (sin la carpeta del proyecto) =====
  'icons/Logo.png', 
  'icons/psicoanalista.png',
  'icons/Coach.png',
  'icons/Astra.png',
  'icons/Profesor.png',
  // =======================================================
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Evento 'install': Se dispara cuando el service worker se registra por primera vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  // skipWaiting() fuerza al nuevo service worker a activarse inmediatamente.
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo caché y guardando archivos...');
        // Agregamos todos los archivos de nuestra lista a la caché.
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Service Worker: Falló el cacheo de archivos durante la instalación', err);
      })
  );
});

// Evento 'activate': Se dispara cuando el service worker se activa.
// Se usa para limpiar cachés antiguas.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si la caché no está en nuestra "lista blanca", la borramos.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Le dice al service worker que empiece a controlar la página inmediatamente.
        return self.clients.claim();
    })
  );
});

// Evento 'fetch': Se dispara cada vez que la página realiza una petición de red.
self.addEventListener('fetch', event => {
  // Solo manejamos peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(response => {
          // Si encontramos una respuesta en la caché, la devolvemos.
          if (response) {
            return response;
          }

          // Si no está en la caché, hacemos la petición a la red.
          return fetch(event.request).then(networkResponse => {
            // No cacheamos las respuestas de Firebase para evitar problemas de autenticación.
            if (!event.request.url.includes('firebase')) {
                 // Guardamos una copia de la respuesta de red en la caché para usos futuros.
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
    })
  );
});
