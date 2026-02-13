import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Hook centralisé pour les informations du site
// Évite les requêtes multiples en partageant le cache
export function useSiteInfo() {
  return useQuery({
    queryKey: ["site-info"], // Clé unifiée
    queryFn: () => apiRequest("GET", "/api/site-info"),
    refetchInterval: false, // Pas de refetch automatique
    staleTime: 60 * 60 * 1000, // 1 heure - les infos du site changent très rarement
    gcTime: 2 * 60 * 60 * 1000, // 2 heures en cache
    refetchOnWindowFocus: false, // Pas de refetch sur focus
    refetchOnMount: false, // Ne pas refetch si les données sont fraîches
    retry: 2, // Moins de retries
  });
}

// Hook pour les catégories de menu - CACHE TRÈS LONG
export function useMenuCategories() {
  return useQuery({
    queryKey: ["menu-categories"],
    queryFn: () => apiRequest("GET", "/api/menu-categories"),
    refetchInterval: false, // Jamais de refetch auto
    staleTime: 2 * 60 * 60 * 1000, // 2 heures - les catégories changent très rarement
    gcTime: 4 * 60 * 60 * 1000, // 4 heures en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

// Hook pour les plats takeout - OPTIMISÉ pour éviter les doubles requêtes
export function useTakeoutDishes() {
  return useQuery({
    queryKey: ["takeout-dishes"],
    queryFn: async () => {
      const result = await apiRequest("GET", "/api/dishes?isTakeout=1");
      return result;
    },
    refetchInterval: false, // Pas de refetch auto - mise à jour via refresh manuel
    staleTime: 15 * 60 * 1000, // Fresh pendant 15 minutes
    gcTime: 30 * 60 * 1000, // Cache pendant 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

// Hooks d'administration avec authentification
export function useAdminTakeoutDishes() {
  return useQuery({
    queryKey: ["admin", "dishes"],
    queryFn: () => apiRequest("GET", "/api/admin/dishes"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiRequest("GET", "/api/admin/categories"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

// Hook pour gallery admin
export function useAdminGallery() {
  return useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => apiRequest("GET", "/api/admin/gallery"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// Hook pour gallery albums admin
export function useAdminGalleryAlbums() {
  return useQuery({
    queryKey: ["admin", "gallery-albums"],
    queryFn: () => apiRequest("GET", "/api/admin/gallery-albums"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// Hook pour catering menu admin
export function useAdminCateringMenu() {
  return useQuery({
    queryKey: ["admin", "catering-menu"],
    queryFn: () => apiRequest("GET", "/api/admin/catering-menu"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// Hook pour catering categories admin
export function useAdminCateringCategories() {
  return useQuery({
    queryKey: ["admin", "catering-categories"],
    queryFn: () => apiRequest("GET", "/api/admin/catering-categories"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// Hook pour hero slides admin
export function useAdminHeroSlides() {
  return useQuery({
    queryKey: ["admin", "hero-slides"],
    queryFn: () => apiRequest("GET", "/api/admin/hero-slides"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// Hook pour site info admin (pour settings management)
export function useAdminSiteInfo() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}