import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  cacheStats: Array<{ name: string; count: number }>;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    cacheStats: []
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Installation du Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ PWA: Service Worker enregistré');
          setRegistration(reg);

          // Vérifier les mises à jour
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('❌ PWA: Erreur Service Worker:', err);
        });
    }
  }, []);

  // Écouter l'événement d'installation PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Détecter si l'app est installée
  useEffect(() => {
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setState(prev => ({ 
        ...prev, 
        isInstalled: isStandalone || isIOSStandalone 
      }));
    };

    checkIfInstalled();
    window.addEventListener('DOMContentLoaded', checkIfInstalled);
    
    return () => {
      window.removeEventListener('DOMContentLoaded', checkIfInstalled);
    };
  }, []);

  // Écouter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Installer l'app
  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
        setDeferredPrompt(null);
        return true;
      }
    } catch (error) {
      console.error('❌ PWA: Erreur installation:', error);
    }
    
    return false;
  };

  // Mettre à jour l'app
  const updateApp = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Obtenir les statistiques du cache
  const getCacheStats = async () => {
    if (registration) {
      const messageChannel = new MessageChannel();
      
      return new Promise<Array<{ name: string; count: number }>>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_STATS_RESULT') {
            resolve(event.data.stats);
          }
        };
        
        registration.active?.postMessage(
          { type: 'CACHE_STATS' },
          [messageChannel.port2]
        );
      });
    }
    return [];
  };

  // Vider les caches
  const clearCache = async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('🗑️ PWA: Cache vidé');
      return true;
    } catch (error) {
      console.error('❌ PWA: Erreur vidage cache:', error);
      return false;
    }
  };

  return {
    ...state,
    installApp,
    updateApp,
    getCacheStats,
    clearCache,
    canInstall: state.isInstallable && !state.isInstalled,
    isSupported: 'serviceWorker' in navigator
  };
}