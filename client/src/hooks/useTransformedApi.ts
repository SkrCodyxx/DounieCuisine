import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { convertKeysToCamel, convertKeysToSnake } from '@/lib/caseTransform';

/**
 * Hook useQuery avec transformation automatique snake_case ↔ camelCase
 */
export function useTransformedQuery<TData = any, TError = any>(options: {
  queryKey: string | readonly string[];
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  enabled?: boolean;
  select?: (data: any) => TData;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}) {
  const { queryKey, url, method = 'GET', select, ...queryOptions } = options;
  const finalUrl = url || (typeof queryKey === 'string' ? queryKey : queryKey[0]);
  
  return useQuery<TData, TError>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const rawData = await apiRequest(method, finalUrl);
      // Transformation automatique snake_case -> camelCase
      return convertKeysToCamel(rawData);
    },
    select: select || ((data: any) => data),
    ...queryOptions,
  });
}

/**
 * Hook useMutation avec transformation automatique camelCase → snake_case
 */
export function useTransformedMutation<TData = any, TError = any, TVariables = any>(options: {
  mutationFn: (variables: TVariables) => Promise<any>;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: () => void;
  transformRequest?: boolean;
  transformResponse?: boolean;
}) {
  const queryClient = useQueryClient();
  const { 
    mutationFn, 
    transformRequest = true, 
    transformResponse = true, 
    ...mutationOptions 
  } = options;
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      // Transformation automatique camelCase -> snake_case pour l'envoi
      const transformedVars = transformRequest 
        ? convertKeysToSnake(variables) 
        : variables;
      
      const rawResult = await mutationFn(transformedVars);
      
      // Transformation automatique snake_case -> camelCase pour la réponse
      return transformResponse ? convertKeysToCamel(rawResult) : rawResult;
    },
    ...mutationOptions,
  });
}

/**
 * Hook spécialisé pour les opérations CRUD admin avec cache invalidation
 */
export function useAdminCRUD<TItem = any>(baseUrl: string) {
  const queryClient = useQueryClient();
  
  // Query pour lister les items
  const useList = (options?: { enabled?: boolean; select?: (data: any) => TItem[] }) => {
    return useTransformedQuery<TItem[]>({
      queryKey: [baseUrl],
      ...options,
    });
  };
  
  // Query pour récupérer un item spécifique
  const useOne = (id: number | string, options?: { enabled?: boolean }) => {
    return useTransformedQuery<TItem>({
      queryKey: [baseUrl, String(id)],
      url: `${baseUrl}/${id}`,
      ...options,
    });
  };
  
  // Mutation pour créer un item
  const useCreate = (options?: { onSuccess?: (data: TItem) => void }) => {
    return useTransformedMutation<TItem, Error, Partial<TItem>>({
      mutationFn: (data) => apiRequest('POST', baseUrl, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [baseUrl] });
        options?.onSuccess?.(data);
      },
    });
  };
  
  // Mutation pour mettre à jour un item
  const useUpdate = (options?: { onSuccess?: (data: TItem) => void }) => {
    return useTransformedMutation<TItem, Error, { id: number | string; data: Partial<TItem> }>({
      mutationFn: ({ id, data }) => apiRequest('PUT', `${baseUrl}/${id}`, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [baseUrl] });
        options?.onSuccess?.(data);
      },
    });
  };
  
  // Mutation pour supprimer un item
  const useDelete = (options?: { onSuccess?: () => void }) => {
    return useTransformedMutation<void, Error, number | string>({
      mutationFn: (id) => apiRequest('DELETE', `${baseUrl}/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [baseUrl] });
        options?.onSuccess?.();
      },
    });
  };
  
  return {
    useList,
    useOne,
    useCreate,
    useUpdate,
    useDelete,
  };
}

/**
 * Hooks spécialisés pour les entités principales
 */

// Hook pour la gestion des utilisateurs admin
export function useAdminUsers() {
  return useAdminCRUD<{
    id: number;
    username: string;
    email: string;
    role: string;
    lastLogin?: string;
    active: number;
    createdAt: string;
  }>('/api/admin/users');
}

// Hook pour la gestion du contenu catering
export function useCateringCategories() {
  return useAdminCRUD<{
    id: number;
    nameFr: string;
    nameEn: string;
    descriptionFr?: string;
    descriptionEn?: string;
    displayOrder: number;
    isActive: number;
    createdAt: string;
    updatedAt: string;
    items?: any[];
  }>('/api/admin/catering/categories');
}

// Hook pour la gestion des plats catering
export function useCateringItems() {
  return useAdminCRUD<{
    id: number;
    categoryId: number;
    nameFr: string;
    nameEn: string;
    descriptionFr?: string;
    descriptionEn?: string;
    imageId?: number;
    displayOrder: number;
    isActive: number;
    createdAt: string;
    updatedAt: string;
    prices?: any[];
  }>('/api/admin/catering/items');
}

// Hook pour les informations du site
export function useSiteInfo() {
  const queryClient = useQueryClient();
  
  const useGet = () => {
    return useTransformedQuery<{
      id: number;
      businessName: string;
      companyName?: string;
      tagline?: string;
      description?: string;
      address: string;
      city: string;
      postalCode: string;
      emailPrimary: string;
      phone1?: string;
      whatsappNumber?: string;
      facebookUrl?: string;
      instagramUrl?: string;
      twitterUrl?: string;
      youtubeUrl?: string;
      linkedinUrl?: string;
      logoId?: number;
      logoVisible: boolean;
      maintenanceMode: boolean;
      onlineOrderingEnabled: boolean;
      reservationsEnabled: boolean;
      newsletterEnabled: boolean;
    }>({
      queryKey: ['/api/admin/site-info'],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  const useUpdate = (options?: { onSuccess?: (data: any) => void }) => {
    return useTransformedMutation<any, Error, any>({
      mutationFn: (data) => apiRequest('PUT', '/api/admin/site-info', data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/site-info'] });
        queryClient.invalidateQueries({ queryKey: ['/api/site-info'] }); // Cache public
        options?.onSuccess?.(data);
      },
    });
  };
  
  return { useGet, useUpdate };
}

// Hook pour les témoignages
export function useTestimonials() {
  return useAdminCRUD<{
    id: number;
    customerName: string;
    rating: number;
    content: string;
    isVisible: boolean;
    isVerified: boolean;
    createdAt: string;
  }>('/api/admin/testimonials');
}

// Hook pour les pages légales
export function useLegalPages() {
  return useAdminCRUD<{
    id: number;
    title: string;
    slug: string;
    content: string;
    metaDescription?: string;
    active: number;
    displayOrder?: number;
    createdAt: string;
    updatedAt: string;
  }>('/api/admin/legal-pages');
}