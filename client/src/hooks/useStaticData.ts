/**
 * Hook optimisé pour les données statiques
 * Cache long - recharge seulement toutes les 30 minutes ou au reload
 */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const STATIC_CACHE_TIME = 30 * 60 * 1000; // 30 minutes
const STATIC_STALE_TIME = 25 * 60 * 1000; // Fresh pendant 25 minutes

/**
 * Hook pour les données qui changent rarement
 */
export function useStaticData() {
  // Site info - presque jamais modifié
  const siteInfo = useQuery({
    queryKey: ['static', 'site-info'],
    queryFn: () => apiRequest("GET", "/api/site-info"),
    refetchInterval: false, // Pas de refetch automatique
    staleTime: STATIC_STALE_TIME,
    gcTime: STATIC_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Menu dishes - modifié occasionnellement
  const dishes = useQuery({
    queryKey: ['static', 'dishes'],
    queryFn: () => apiRequest("GET", "/api/dishes"),
    refetchInterval: 15 * 60 * 1000, // 15 minutes seulement
    staleTime: 10 * 60 * 1000,
    gcTime: STATIC_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Categories - très rarement modifiées
  const categories = useQuery({
    queryKey: ['static', 'categories'],
    queryFn: () => apiRequest("GET", "/api/menu-categories"),
    refetchInterval: false,
    staleTime: STATIC_STALE_TIME,
    gcTime: STATIC_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Galerie - modifiée occasionnellement
  const gallery = useQuery({
    queryKey: ['static', 'gallery'],
    queryFn: () => apiRequest("GET", "/api/gallery"),
    refetchInterval: 20 * 60 * 1000, // 20 minutes
    staleTime: 15 * 60 * 1000,
    gcTime: STATIC_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    siteInfo: siteInfo.data,
    dishes: dishes.data,
    categories: categories.data,
    gallery: gallery.data,
    
    // Loading states
    isLoading: siteInfo.isLoading || dishes.isLoading || categories.isLoading || gallery.isLoading,
    
    // Manual refresh pour forcer update si besoin
    refreshAll: () => {
      siteInfo.refetch();
      dishes.refetch();
      categories.refetch();
      gallery.refetch();
    }
  };
}

/**
 * Hook pour les données admin statiques (settings, configs)
 */
export function useAdminStaticData() {
  // Configuration Square - modifiée très rarement
  const squareConfig = useQuery({
    queryKey: ['admin', 'static', 'square-config'],
    queryFn: () => apiRequest("GET", "/api/payments/square/config"),
    refetchInterval: false,
    staleTime: STATIC_STALE_TIME,
    gcTime: STATIC_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Zones de livraison - modifiées rarement
  const deliveryZones = useQuery({
    queryKey: ['admin', 'static', 'delivery-zones'],
    queryFn: () => apiRequest("GET", "/api/admin/delivery-zones"),
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    staleTime: 8 * 60 * 1000,
    gcTime: STATIC_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    squareConfig: squareConfig.data,
    deliveryZones: deliveryZones.data,
    isLoading: squareConfig.isLoading || deliveryZones.isLoading,
    
    refreshConfigs: () => {
      squareConfig.refetch();
      deliveryZones.refetch();
    }
  };
}