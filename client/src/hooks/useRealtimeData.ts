import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useMemo } from "react";

/**
 * Hook pour gérer les données en temps réel
 * Invalide automatiquement les caches et force le rechargement
 */
export function useRealtimeData(queryKeys: string[] = ["/api/dishes", "catering-categories"]) {
  const queryClient = useQueryClient();

  // Mémoriser les queryKeys pour éviter les re-créations infinies
  // Utiliser JSON.stringify pour une comparaison plus stable
  const queryKeysStr = JSON.stringify(queryKeys);
  const memoizedQueryKeys = useMemo(() => queryKeys, [queryKeysStr]);

  // Fonction pour forcer la mise à jour des données
  const refreshData = useCallback(async () => {
    // Invalider et refetch toutes les queries spécifiées
    await Promise.all(
      memoizedQueryKeys.map(async (key) => {
        await queryClient.invalidateQueries({ queryKey: [key] });
        await queryClient.refetchQueries({ queryKey: [key] });
      })
    );
  }, [queryClient, memoizedQueryKeys]);

  // Fonction pour invalider le cache complet
  const clearCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  // Auto-refresh périodique DÉSACTIVÉ (trop fréquent)
  // Les données sont mises à jour via SSE pour l'admin et cache long pour le public
  // useEffect(() => {
  //   const interval = setInterval(refreshData, 15000);
  //   return () => clearInterval(interval);
  // }, [refreshData]);

  // Refresh au focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);

  // Refresh au retour de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshData]);

  return {
    refreshData,
    clearCache,
  };
}