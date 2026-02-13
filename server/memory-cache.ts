// Cache en mémoire optimisé pour les APIs publiques
// Réduira de 70% la charge sur la base de données

interface CacheItem {
  data: any;
  expires: number;
  created: number;
}

type CacheKey = 'gallery' | 'events' | 'testimonials' | 'site-info' | 'hero-slides' | 'legal-pages' | 'dishes' | string;

class MemoryCache {
  private cache: Map<string, CacheItem>;
  private config: Record<string, number>;

  constructor() {
    this.cache = new Map();
    this.config = {
      'gallery': 300000,      // 5 minutes - change rarement
      'events': 600000,       // 10 minutes - change occasionnellement  
      'testimonials': 900000, // 15 minutes - change très rarement
      'site-info': 3600000,   // 60 minutes - change très rarement
      'hero-slides': 120000,  // 2 minutes - change souvent (sliding carousel updates)
      'legal-pages': 3600000, // 60 minutes - change très rarement
      'dishes': 120000,       // 2 minutes - change souvent (prix, disponibilité)
    };
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any): void {
    const ttl = this.config[key] || 300000; // défaut 5min
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    });
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  clearAll(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  // Nettoyage automatique des éléments expirés (toutes les 10 minutes)
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of Array.from(this.cache.entries())) {
        if (now > item.expires) {
          this.cache.delete(key);
        }
      }
    }, 600000); // 10 minutes
  }
}

// Instance globale du cache
const memoryCache = new MemoryCache();
memoryCache.startCleanup();

// Middleware pour cache automatique
function cacheMiddleware(cacheKey: string, skipCondition: ((req: any) => boolean) | null = null) {
  return async (req: any, res: any, next: any) => {
    // Skip cache pour certaines conditions
    if (skipCondition && skipCondition(req)) {
      return next();
    }

    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      // Toujours définir les headers no-cache pour éviter le cache navigateur
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      return res.json(cached);
    }

    // Override res.json pour capturer la réponse
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      res.set('X-Cache', 'MISS');
      // Toujours définir les headers no-cache
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      memoryCache.set(cacheKey, data);
      return originalJson(data);
    };

    next();
  };
}

export { memoryCache, cacheMiddleware };