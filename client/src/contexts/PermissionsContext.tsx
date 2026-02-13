import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Permission {
  moduleId: number;
  moduleName: string;
  moduleDisplayName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  active: number;
}

interface PermissionsContextType {
  user: User | null;
  permissions: Permission[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  hasPermission: (moduleName: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
  canViewModule: (moduleName: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  // Récupérer l'utilisateur actuel - avec cache optimisé pour admin
  const { data: user = null, isLoading: userLoading } = useQuery<User | null>({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/auth/me");
        return response as User;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - session admin stable
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Récupérer les permissions - avec cache optimisé
  const { data: permissions = [], isLoading: permsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/admin/users", user?.id, "permissions"],
    queryFn: () => apiRequest("GET", `/api/admin/users/${user?.id}/permissions`),
    enabled: !!user && user.role !== 'super_admin',
    select: (data: any) => Array.isArray(data) ? data : [],
    staleTime: 15 * 60 * 1000, // 15 minutes - permissions changent rarement
    gcTime: 45 * 60 * 1000, // 45 minutes en cache
    refetchOnWindowFocus: false,
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const isLoading = userLoading || permsLoading;

  const hasPermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    // Super admins ont tous les droits
    if (isSuperAdmin) return true;

    // Trouver la permission pour ce module
    const perm = permissions.find(p => p.moduleName === moduleName);
    if (!perm) return false;

    // Vérifier l'action spécifique
    switch (action) {
      case 'view': return perm.canView || false;
      case 'create': return perm.canCreate || false;
      case 'edit': return perm.canEdit || false;
      case 'delete': return perm.canDelete || false;
      default: return false;
    }
  };

  const canViewModule = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'view');
  };

  return (
    <PermissionsContext.Provider 
      value={{
        user,
        permissions,
        isLoading,
        isSuperAdmin,
        hasPermission,
        canViewModule,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
