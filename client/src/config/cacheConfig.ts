/**
 * Configuration centralisée des intervals pour optimiser les performances
 */

export const CACHE_CONFIG = {
  // Données statiques (changent très rarement)
  STATIC: {
    REFETCH_INTERVAL: false, // Pas de refetch auto
    STALE_TIME: 25 * 60 * 1000, // 25 minutes
    GC_TIME: 30 * 60 * 1000, // 30 minutes
  },

  // Données semi-statiques (changent occasionnellement)
  SEMI_STATIC: {
    REFETCH_INTERVAL: 15 * 60 * 1000, // 15 minutes
    STALE_TIME: 10 * 60 * 1000, // 10 minutes
    GC_TIME: 20 * 60 * 1000, // 20 minutes
  },

  // Données dynamiques (importantes mais pas critiques)
  DYNAMIC: {
    REFETCH_INTERVAL: 2 * 60 * 1000, // 2 minutes
    STALE_TIME: 60 * 1000, // 1 minute
    GC_TIME: 5 * 60 * 1000, // 5 minutes
  },

  // Données critiques (temps réel mais optimisé)
  CRITICAL: {
    REFETCH_INTERVAL: 30 * 1000, // 30 secondes seulement pour le critique
    STALE_TIME: 10 * 1000, // 10 secondes
    GC_TIME: 2 * 60 * 1000, // 2 minutes
  },

  // Real-time settings
  REALTIME: {
    SSE_HEARTBEAT_INTERVAL: 2 * 60 * 1000, // 2 minutes
    RECONNECT_INTERVAL: 30 * 1000, // 30 secondes
    MAX_RECONNECT_ATTEMPTS: 5,
  }
};

/**
 * Types de données par catégorie pour faciliter l'utilisation
 */
export const DATA_CATEGORIES = {
  STATIC: [
    'site-info',
    'menu-categories', 
    'legal-pages',
    'testimonials',
    'delivery-zones-config'
  ],
  
  SEMI_STATIC: [
    'dishes',
    'gallery',
    'events',
    'hero-slides'
  ],
  
  DYNAMIC: [
    'dashboard-stats',
    'recent-activity',
    'admin-notifications'
  ],
  
  CRITICAL: [
    'new-orders',
    'order-status-updates',
    'new-messages'
  ]
};

/**
 * Helper pour obtenir la config appropriée selon le type de données
 */
export function getCacheConfig(dataType: keyof typeof DATA_CATEGORIES) {
  return CACHE_CONFIG[dataType];
}

export default CACHE_CONFIG;