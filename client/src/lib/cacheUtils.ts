import { queryClient } from './queryClient';

/**
 * Force un rafraîchissement immédiat du cache pour garantir que l'UI se met à jour en temps réel
 * Utilisé après les mutations pour éviter les faux positifs où le toast dit "succès" mais l'UI ne change pas
 */
export function forceRefreshCache(queryKey: string | string[]) {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  // 1. Invalide le cache
  queryClient.invalidateQueries({ 
    queryKey: key,
    refetchType: 'active'
  });
  
  // 2. Force un refetch immédiat
  queryClient.refetchQueries({ queryKey: key });
}

/**
 * Force le rafraîchissement de plusieurs caches en parallèle
 */
export function forceRefreshMultipleCaches(queryKeys: (string | string[])[]) {
  queryKeys.forEach(queryKey => forceRefreshCache(queryKey));
}

/**
 * Mapping des routes admin → public pour synchronisation temps réel
 * Quand une mutation admin modifie des données, on invalide AUSSI le cache public
 */
const ADMIN_TO_PUBLIC_CACHE_MAP: Record<string, string[]> = {
  "/api/admin/menu-sections": ["/api/menu-sections"],
  "/api/admin/events": ["/api/events"],
  "/api/admin/gallery": ["/api/gallery"],
  "/api/admin/hero-slides": ["/api/hero-slides"],
  "/api/admin/testimonials": ["/api/testimonials"],
  "/api/admin/catering-categories": ["/api/catering-menu"],
  "/api/admin/catering-items": ["/api/catering-menu"],
  "/api/admin/dishes": ["/api/dishes"],
  "/api/admin/daily-menu": ["/api/daily-menu"],
  "/api/admin/site-info": ["/api/site-info"],
  "/api/admin/delivery-zones": ["/api/delivery-zones"],
  "/api/admin/legal-pages": ["/api/legal-pages"],
};

/**
 * Invalide AUTOMATIQUEMENT les caches admin ET public associés
 * Utiliser cette fonction après toute mutation admin affectant des données publiques
 */
export function refreshAdminAndPublicCache(adminRoute: string) {
  const publicRoutes = ADMIN_TO_PUBLIC_CACHE_MAP[adminRoute] || [];
  const allRoutes = [adminRoute, ...publicRoutes];
  forceRefreshMultipleCaches(allRoutes);
}

/**
 * Fonctions spécialisées pour les menus
 */

// Invalider les données de menu takeout
export const invalidateTakeoutMenu = async () => {
  await queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
  await queryClient.refetchQueries({ queryKey: ["/api/dishes"] });
};

// Invalider les données de menu catering
export const invalidateCateringMenu = async () => {
  await queryClient.invalidateQueries({ queryKey: ["catering-categories"] });
  await queryClient.invalidateQueries({ queryKey: ["catering-menu-complete"] });
  await queryClient.refetchQueries({ queryKey: ["catering-categories"] });
  await queryClient.refetchQueries({ queryKey: ["catering-menu-complete"] });
};

// Invalider toutes les données de menu
export const invalidateAllMenus = async () => {
  await invalidateTakeoutMenu();
  await invalidateCateringMenu();
};

// Invalider les variantes d'un plat spécifique
export const invalidateDishVariants = async (dishId: number) => {
  // Invalider les caches admin et public pour les variantes
  await queryClient.invalidateQueries({ queryKey: [`/api/admin/dishes/${dishId}/variants`] });
  await queryClient.invalidateQueries({ queryKey: [`/api/dishes/${dishId}/variants`] });
  // Invalider aussi la liste globale des plats pour mettre à jour hasVariants
  await queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
  await queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] });
  await queryClient.invalidateQueries({ queryKey: ["takeout-dishes"] });
  
  // Forcer le refetch immédiat
  await queryClient.refetchQueries({ queryKey: [`/api/admin/dishes/${dishId}/variants`] });
  await queryClient.refetchQueries({ queryKey: [`/api/dishes/${dishId}/variants`] });
  await queryClient.refetchQueries({ queryKey: ["/api/dishes"] });
  await queryClient.refetchQueries({ queryKey: ["takeout-dishes"] });
};

/**
 * Hook-like function pour les mutations avec invalidation automatique
 */
export const createMutationWithAutoRefresh = (options: {
  onSuccess?: (...args: any[]) => void;
  invalidateMenus?: "takeout" | "catering" | "all";
  adminRoute?: string;
}) => {
  return {
    ...options,
    onSuccess: async (...args: any[]) => {
      // Exécuter le onSuccess original s'il existe
      if (options.onSuccess) {
        options.onSuccess(...args);
      }

      // Invalider les caches selon le type spécifié
      switch (options.invalidateMenus) {
        case "takeout":
          await invalidateTakeoutMenu();
          break;
        case "catering":
          await invalidateCateringMenu();
          break;
        case "all":
          await invalidateAllMenus();
          break;
      }

      // Invalider également les caches admin/public si une route admin est spécifiée
      if (options.adminRoute) {
        refreshAdminAndPublicCache(options.adminRoute);
      }
    },
  };
};
