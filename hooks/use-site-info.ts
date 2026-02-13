"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import type { SiteInfo } from "@/lib/schema";

export function useSiteInfo() {
  return useQuery<SiteInfo>({
    queryKey: ["/api/site-info"],
    queryFn: () => apiRequest<SiteInfo>("GET", "/api/site-info"),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

export function useMenuCategories() {
  return useQuery({
    queryKey: ["/api/menu-categories"],
    queryFn: () => apiRequest("GET", "/api/menu-categories"),
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

export function useTakeoutDishes() {
  return useQuery({
    queryKey: ["/api/dishes?isTakeout=1"],
    queryFn: () => apiRequest("GET", "/api/dishes?isTakeout=1"),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}
