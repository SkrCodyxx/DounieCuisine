import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Check, X } from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  active: number;
}

interface AdminModule {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

interface Permission {
  id?: number;
  adminUserId: number;
  moduleId: number;
  moduleName?: string;
  moduleDisplayName?: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
}

export default function PermissionsDialog({ open, onOpenChange, user }: PermissionsDialogProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Record<number, Permission>>({});

  // Récupérer tous les modules disponibles
  const { data: modules = [] } = useQuery<AdminModule[]>({
    queryKey: ["/api/admin/modules"],
    queryFn: () => apiRequest("GET", "/api/admin/modules"),
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Récupérer les permissions actuelles de l'utilisateur
  const { data: userPermissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["/api/admin/users", user?.id, "permissions"],
    queryFn: () => apiRequest("GET", `/api/admin/users/${user?.id}/permissions`),
    enabled: !!user && open,
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Initialiser les permissions récupérées quand la requête réussit
  useEffect(() => {
    if (!user || !open) return;
    if (user.role === 'super_admin') return; // les super admins gérés ci-dessous
    if (!Array.isArray(userPermissions)) return;

    const permsMap: Record<number, Permission> = {};
    userPermissions.forEach((perm: Permission) => {
      if (perm && typeof perm.moduleId === 'number') {
        permsMap[perm.moduleId] = perm;
      }
    });
    setPermissions(permsMap);
  }, [user, open, userPermissions]);

  // Initialiser les permissions si super admin (accès complet)
  useEffect(() => {
    if (!user || !open) return;
    if (user.role !== 'super_admin') return;
    if (modules.length === 0) return;

    const allPerms: Record<number, Permission> = {};
    modules.forEach((module) => {
      allPerms[module.id] = {
        adminUserId: user.id,
        moduleId: module.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      };
    });
    setPermissions(allPerms);
  }, [user, open, modules]);

  // Mutation pour sauvegarder les permissions
  const savePermissionsMutation = useMutation({
    mutationFn: async (perms: Permission[]) => {
      return apiRequest("POST", `/api/admin/users/${user?.id}/permissions`, {
        permissions: perms
      });
    },
    onSuccess: () => {
      toast({ title: "Permissions mises à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user?.id, "permissions"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de sauvegarder les permissions",
        variant: "destructive" 
      });
    }
  });

  const togglePermission = (moduleId: number, field: keyof Omit<Permission, 'id' | 'adminUserId' | 'moduleId' | 'moduleName' | 'moduleDisplayName'>) => {
    if (!user) return;
    
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        adminUserId: user.id,
        moduleId,
        [field]: !prev[moduleId]?.[field],
      }
    }));
  };

  const handleSave = () => {
    const permsArray = Object.values(permissions).filter(p => 
      p.canView || p.canCreate || p.canEdit || p.canDelete
    );
    savePermissionsMutation.mutate(permsArray);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gérer les Permissions - {user.username}
          </DialogTitle>
          <DialogDescription>
            {user.role === 'super_admin' ? (
              <Badge variant="default" className="bg-yellow-500">
                Super Admin - Accès complet automatique
              </Badge>
            ) : (
              "Configurez les accès aux différents modules d'administration"
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Chargement des permissions...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 p-2 bg-muted rounded font-semibold text-sm">
              <div>Module</div>
              <div className="text-center">Voir</div>
              <div className="text-center">Créer</div>
              <div className="text-center">Modifier</div>
              <div className="text-center">Supprimer</div>
            </div>

            {modules.map((module) => {
              const perm = permissions[module.id] || {
                adminUserId: user.id,
                moduleId: module.id,
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
              };

              return (
                <div key={module.id} className="grid grid-cols-5 gap-2 p-3 border rounded-lg items-center hover:bg-accent/50 transition-colors">
                  <div>
                    <div className="font-medium">{module.displayName}</div>
                    {module.description && (
                      <div className="text-xs text-muted-foreground">{module.description}</div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.canView}
                      onCheckedChange={() => togglePermission(module.id, 'canView')}
                      disabled={user.role === 'super_admin'}
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.canCreate}
                      onCheckedChange={() => togglePermission(module.id, 'canCreate')}
                      disabled={user.role === 'super_admin'}
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.canEdit}
                      onCheckedChange={() => togglePermission(module.id, 'canEdit')}
                      disabled={user.role === 'super_admin'}
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.canDelete}
                      onCheckedChange={() => togglePermission(module.id, 'canDelete')}
                      disabled={user.role === 'super_admin'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={savePermissionsMutation.isPending || user.role === 'super_admin'}
          >
            <Check className="h-4 w-4 mr-2" />
            {savePermissionsMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
