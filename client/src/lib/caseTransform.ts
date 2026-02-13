/**
 * Utilitaires pour standardiser les conventions de nommage
 * Conversion automatique entre snake_case (DB) et camelCase (Frontend)
 */

/**
 * Convertit une chaîne snake_case vers camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convertit une chaîne camelCase vers snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convertit récursivement un objet snake_case vers camelCase
 */
export function convertKeysToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel) as T;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    Object.keys(obj).forEach(key => {
      const camelKey = snakeToCamel(key);
      converted[camelKey] = convertKeysToCamel(obj[key]);
    });
    return converted;
  }
  
  return obj;
}

/**
 * Convertit récursivement un objet camelCase vers snake_case
 */
export function convertKeysToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnake) as T;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    Object.keys(obj).forEach(key => {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = convertKeysToSnake(obj[key]);
    });
    return converted;
  }
  
  return obj;
}

/**
 * Hook personnalisé pour les transformations automatiques d'API
 */
export function createApiTransform() {
  return {
    // Transformer les données reçues de l'API (snake_case -> camelCase)
    transformResponse: <T>(data: any): T => {
      return convertKeysToCamel<T>(data);
    },
    
    // Transformer les données envoyées à l'API (camelCase -> snake_case)
    transformRequest: <T>(data: any): T => {
      return convertKeysToSnake<T>(data);
    }
  };
}

/**
 * Transformations spécifiques pour certaines propriétés
 */
export const FIELD_MAPPINGS = {
  // Mappings fréquents pour les composants admin
  businessName: 'business_name',
  companyName: 'company_name',
  emailPrimary: 'email_primary',
  emailSecondary: 'email_secondary',
  emailSupport: 'email_support',
  whatsappNumber: 'whatsapp_number',
  postalCode: 'postal_code',
  siteUrl: 'site_url',
  adminUrl: 'admin_url',
  facebookUrl: 'facebook_url',
  instagramUrl: 'instagram_url',
  twitterUrl: 'twitter_url',
  youtubeUrl: 'youtube_url',
  linkedinUrl: 'linkedin_url',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
  metaKeywords: 'meta_keywords',
  logoVisible: 'logo_visible',
  deliveryRadiusKm: 'delivery_radius_km',
  tpsRate: 'tps_rate',
  tvqRate: 'tvq_rate',
  maintenanceMode: 'maintenance_mode',
  onlineOrderingEnabled: 'online_ordering_enabled',
  reservationsEnabled: 'reservations_enabled',
  newsletterEnabled: 'newsletter_enabled',
  logoId: 'logo_id',
  businessHours: 'business_hours',
  
  // Champs de dates standards
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  lastLogin: 'last_login',
  
  // Champs d'état
  isActive: 'is_active',
  isDefault: 'is_default',
  displayOrder: 'display_order',
  
  // Mappings inverses automatiques
  business_name: 'businessName',
  company_name: 'companyName',
  email_primary: 'emailPrimary',
  email_secondary: 'emailSecondary',
  email_support: 'emailSupport',
  whatsapp_number: 'whatsappNumber',
  postal_code: 'postalCode',
  site_url: 'siteUrl',
  admin_url: 'adminUrl',
  facebook_url: 'facebookUrl',
  instagram_url: 'instagramUrl',
  twitter_url: 'twitterUrl',
  youtube_url: 'youtubeUrl',
  linkedin_url: 'linkedinUrl',
  meta_title: 'metaTitle',
  meta_description: 'metaDescription',
  meta_keywords: 'metaKeywords',
  logo_visible: 'logoVisible',
  delivery_radius_km: 'deliveryRadiusKm',
  tps_rate: 'tpsRate',
  tvq_rate: 'tvqRate',
  maintenance_mode: 'maintenanceMode',
  online_ordering_enabled: 'onlineOrderingEnabled',
  reservations_enabled: 'reservationsEnabled',
  newsletter_enabled: 'newsletterEnabled',
  logo_id: 'logoId',
  business_hours: 'businessHours',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  last_login: 'lastLogin',
  is_active: 'isActive',
  is_default: 'isDefault',
  display_order: 'displayOrder'
} as const;

/**
 * Applique les mappings spécifiques puis la transformation automatique
 */
export function smartTransformToCamel<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  // Appliquer d'abord les mappings spécifiques
  Object.keys(FIELD_MAPPINGS).forEach(key => {
    if (result.hasOwnProperty(key)) {
      const mappedKey = FIELD_MAPPINGS[key as keyof typeof FIELD_MAPPINGS];
      if (mappedKey !== key) {
        result[mappedKey] = result[key];
        delete result[key];
      }
    }
  });
  
  // Puis appliquer la transformation automatique
  return convertKeysToCamel<T>(result);
}

/**
 * Applique les mappings spécifiques puis la transformation automatique
 */
export function smartTransformToSnake<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  // Appliquer d'abord les mappings spécifiques
  Object.keys(FIELD_MAPPINGS).forEach(key => {
    if (result.hasOwnProperty(key)) {
      const mappedKey = FIELD_MAPPINGS[key as keyof typeof FIELD_MAPPINGS];
      if (mappedKey !== key) {
        result[mappedKey] = result[key];
        delete result[key];
      }
    }
  });
  
  // Puis appliquer la transformation automatique
  return convertKeysToSnake<T>(result);
}