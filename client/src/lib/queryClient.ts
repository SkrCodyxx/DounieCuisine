import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Handle 204 No Content or empty responses
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }
  
  // Parse JSON if content-type indicates JSON
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  // For other content types, try to parse JSON with fallback
  try {
    return await res.json();
  } catch {
    // If JSON parsing fails, return null (for empty bodies or non-JSON responses)
    return null;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // OPTIMISÉ pour performance maximale et moins de bombardement
      staleTime: 10 * 60 * 1000, // Données fraîches pendant 10 minutes (plus long)
      gcTime: 30 * 60 * 1000, // Garder en cache 30 minutes (plus long)
      refetchOnWindowFocus: false, // Éviter les re-fetches inutiles
      refetchOnMount: false, // Utiliser le cache si disponible (important)
      refetchOnReconnect: true, // Rafraîchir après reconnexion réseau
      refetchInterval: false, // Pas de polling automatique (économise bande passante)
      retry: 1, // Réessayer une fois en cas d'erreur
      retryDelay: 3000, // Attendre 3s avant de réessayer (plus long)
    },
    mutations: {
      retry: false,
    },
  },
});
