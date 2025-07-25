// service-worker.js

const CACHE_NAME = 'mental-coach-cache-v1.0.1';
// Lista de archivos para precachear.
// Incluye la página principal, los scripts de React/Babel/Tailwind y otros assets.
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
  // NOTA: Agrega aquí las rutas a tus imágenes de personajes si quieres que funcionen offline
  '/MentalCoach&Health/icons/psicoanalista.png',
   '/MentalCoach&Health/icons/Astra.png',
   '/MentalCoach&Health/icons/Profesor.png',
   '/MentalCoach&Health/icons/Coach.png',
];

// Evento 'install': Se dispara cuando el Service Worker se instala.
// Aquí abrimos nuestra caché y agregamos los archivos principales.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo caché y guardando archivos principales');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Todos los archivos fueron cacheados exitosamente.');
        return self.skipWaiting(); // Forzar la activación del nuevo SW
      })
      .catch(error => {
        console.error('Service Worker: Falló el cacheo de archivos durante la instalación.', error);
      })
  );
});

// Evento 'activate': Se dispara después de la instalación.
// Aquí limpiamos cachés antiguas que ya no se necesitan.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Reclamando clientes...');
        return self.clients.claim(); // Tomar control inmediato de la página
    })
  );
});

// Evento 'fetch': Se dispara cada vez que la página realiza una petición de red.
// Interceptamos la petición y respondemos con el archivo desde la caché si está disponible.
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, la retornamos.
        if (response) {
          // console.log('Service Worker: Sirviendo desde caché:', event.request.url);
          return response;
        }

        // Si no está en caché, intentamos obtenerla de la red.
        // console.log('Service Worker: Buscando en la red:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Si la respuesta de red es válida, la clonamos y la guardamos en caché para el futuro.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Es importante clonar la respuesta. Una respuesta es un 'Stream'
            // y solo puede ser consumida una vez. Necesitamos una para el navegador y otra para la caché.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            // Si tanto la caché como la red fallan, podrías mostrar una página offline genérica.
            console.error('Service Worker: Error de fetch. Ni caché ni red disponibles.', error);
            // Opcional: retornar una página de fallback
            // return caches.match('/offline.html'); 
        });
      })
  );
});
