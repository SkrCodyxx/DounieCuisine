// Service Worker de nettoyage - Version 2.0.0
// Ce SW se désinstalle lui-même et supprime tous les caches

console.log('🧹 SW: Service Worker de nettoyage activé');

// Installation : nettoyer tous les caches
self.addEventListener('install', (event) => {
  console.log('🗑️ SW: Suppression de tous les caches');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ SW: Suppression du cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ SW: Tous les caches supprimés');
      return self.skipWaiting();
    })
  );
});

// Activation : prendre le contrôle et se désinscrire
self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activation du nettoyage');
  
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('✅ SW: Contrôle pris sur tous les clients');
      
      // Se désinscrire automatiquement
      return self.registration.unregister().then(() => {
        console.log('👋 SW: Service Worker désinscrit avec succès');
        
        // Informer tous les clients de recharger
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UNREGISTERED',
              message: 'Service Worker supprimé, veuillez recharger la page'
            });
          });
        });
      });
    })
  );
});

// Ne plus intercepter les requêtes - laisser passer toutes les requêtes réseau
self.addEventListener('fetch', (event) => {
  // Ne rien faire - laisser passer toutes les requêtes
  return;
});
