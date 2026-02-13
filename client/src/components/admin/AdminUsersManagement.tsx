import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminUsers } from "@/hooks/useTransformedApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Shield, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Crown,
  Settings,
  Key
} from "lucide-react";
import PermissionsDialog from "./PermissionsDialog";

// Schema pour la validation
const adminUserSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit faire au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
  role: z.enum(["admin", "super_admin"])
});

type AdminUserForm = z.infer<typeof adminUserSchema>;

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
  lastActivity?: string;
  active: number;
  createdAt: string;
  createdBy?: number;
}

export default function AdminUsersManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<AdminUser | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Récupérer la liste des admins
  const { data: adminUsers = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
    select: (data) => Array.isArray(data) ? data : []
  });

  const form = useForm<AdminUserForm>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "admin"
    }
  });

  // Créer un nouvel admin
  const createMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      toast({ title: "Administrateur créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la création", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mettre à jour un admin
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AdminUser> }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Administrateur mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Supprimer un admin
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "Administrateur supprimé" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Changer mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/password`, { password });
    },
    onSuccess: () => {
      toast({ title: "Mot de passe modifié avec succès" });
      setPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUserForPassword(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors du changement de mot de passe", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: AdminUserForm) => {
    createMutation.mutate(data);
  };

  const toggleUserActive = (user: AdminUser) => {
    updateMutation.mutate({
      id: user.id,
      data: { active: user.active ? 0 : 1 }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Jamais";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    return role === "super_admin" ? (
      <Crown className="h-4 w-4 text-yellow-500" />
    ) : (
      <Shield className="h-4 w-4 text-blue-500" />
    );
  };

  const getRoleBadge = (role: string) => {
    return role === "super_admin" ? (
      <Badge variant="default" className="bg-yellow-500">Super Admin</Badge>
    ) : (
      <Badge variant="outline">Admin</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Administrateurs</h2>
          <p className="text-muted-foreground">
            Gérez les comptes administrateurs de votre site
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Administrateur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel administrateur au système
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom d'utilisateur</label>
                <Input
                  {...form.register("username")}
                  placeholder=""
                  className="mt-1"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder=""
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Mot de passe</label>
                <Input
                  {...form.register("password")}
                  type="password"
                  placeholder=""
                  className="mt-1"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Rôle</label>
                <select
                  {...form.register("role")}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </form>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Comptes administrateurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Array.isArray(adminUsers) ? adminUsers.filter(u => u.active === 1).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Comptes actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {Array.isArray(adminUsers) ? adminUsers.filter(u => u.role === "super_admin").length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Privilèges complets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table des administrateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Administrateurs ({adminUsers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers && adminUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Dernière Connexion</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          {user.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user.lastLogin)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForPermissions(user);
                            setPermissionsDialogOpen(true);
                          }}
                          title="Gérer les permissions"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForPassword(user);
                            setPasswordDialogOpen(true);
                          }}
                          title="Changer le mot de passe"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserActive(user)}
                        >
                          {user.active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Voulez-vous vraiment supprimer l'administrateur "{user.username}" ?
                                {user.role === 'super_admin' && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                                    ⚠️ Attention : Vous supprimez un Super Admin. Le système garantit qu'il restera au moins 1 super admin actif.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(user.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun administrateur</h3>
              <p className="text-muted-foreground">
                Créez votre premier compte administrateur
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité & Bonnes Pratiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">Recommandations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Utilisez des mots de passe forts (8+ caractères)</li>
                <li>• Limitez le nombre de Super Admins</li>
                <li>• Vérifiez régulièrement les dernières connexions</li>
                <li>• Désactivez les comptes inutilisés</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-orange-600">Permissions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Super Admin:</strong> Accès complet au système</li>
                <li>• <strong>Admin:</strong> Gestion contenu et commandes</li>
                <li>• Les Super Admins ne peuvent pas être supprimés</li>
                <li>• Seuls les Super Admins peuvent créer des admins</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de gestion des permissions */}
      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        user={selectedUserForPermissions}
      />

      {/* Dialog de changement de mot de passe */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Changement du mot de passe pour "{selectedUserForPassword?.username}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="text-sm font-medium">
                Nouveau mot de passe
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setNewPassword("");
                setSelectedUserForPassword(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedUserForPassword && newPassword.length >= 8) {
                  changePasswordMutation.mutate({
                    userId: selectedUserForPassword.id,
                    password: newPassword
                  });
                }
              }}
              disabled={newPassword.length < 8 || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}