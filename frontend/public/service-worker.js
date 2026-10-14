/* Service worker de TalentHub México.
 *
 * Hace dos cosas, y a propósito nada más:
 *  1. Guarda en caché el "app shell" (index.html y los archivos de /static,
 *     que llevan hash en el nombre) para que la app abra rápido.
 *  2. Si no hay red, en lugar de la página de error del navegador muestra
 *     offline.html.
 *
 * Solo atiende peticiones GET del mismo origen. La API vive en otro dominio
 * (onrender.com) y las fuentes en Google: esas pasan directo a la red, para
 * no mostrar nunca vacantes o postulaciones viejas desde la caché.
 */
const VERSION = 'v1';
const SHELL = `talenthub-shell-${VERSION}`;
const ASSETS = `talenthub-assets-${VERSION}`;
const PRECACHE = ['/', '/offline.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navegación (abrir /, /vacantes, ...): primero la red, para tener siempre
  // la versión publicada; sin red, el index guardado o la página offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // JS/CSS/imágenes con hash: nunca cambian, así que caché primero.
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
