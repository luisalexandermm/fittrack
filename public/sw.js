// ============================================================
//  sw.js — service worker de FitTrack
//  Solo sirve para recibir los RECORDATORIOS (notificaciones push).
//  No guarda nada en caché: la app siempre pide tus datos al servidor,
//  así ninguna información personal queda guardada en el dispositivo.
// ============================================================

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', evento => evento.waitUntil(self.clients.claim()));

// Llega un recordatorio desde el servidor
self.addEventListener('push', evento => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch (error) {
    datos = { cuerpo: evento.data ? evento.data.text() : '' };
  }
  evento.waitUntil(self.registration.showNotification(datos.titulo || 'FitTrack', {
    body: datos.cuerpo || 'Hoy toca entrenar.',
    icon: '/img/pwa-192.png',
    badge: '/img/pwa-192.png',
    tag: 'recordatorio-entreno', // si llegan dos, se reemplaza en vez de amontonarse
    data: { url: datos.url || '/app#inicio' }
  }));
});

// Al tocar la notificación: abre FitTrack (o la trae al frente si ya está abierta)
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  const url = evento.notification.data && evento.notification.data.url ? evento.notification.data.url : '/app#inicio';
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ventanas => {
      const abierta = ventanas.find(v => new URL(v.url).pathname.startsWith('/app'));
      if (abierta) return abierta.focus().then(v => (v.navigate ? v.navigate(url) : v));
      return self.clients.openWindow(url);
    })
  );
});
