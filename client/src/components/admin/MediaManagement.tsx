import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
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
  HardDrive, 
  Trash2, 
  FileImage, 
  RefreshCw,
  Database,
  TrendingUp,
  FolderOpen,
  Zap
} from "lucide-react";

interface MediaStats {
  totalFiles: number;
  totalSize: string;
  orphanedFiles: number;
  optimizableImages: number;
  diskUsage: {
    used: string;
    available: string;
    percentage: number;
  };
}

interface OrphanedFile {
  id: string;
  filename: string;
  size: string;
  lastAccessed: string;
  path: string;
}

export default function MediaManagement() {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Récupérer les statistiques des médias
  const { data: mediaStats, isLoading: isStatsLoading } = useQuery<MediaStats>({
    queryKey: ["/api/admin/media/stats"],
    queryFn: () => apiRequest("GET", "/api/admin/media/stats"),
  });

  // Récupérer les fichiers orphelins
  const { data: orphanedFiles, isLoading: isOrphansLoading } = useQuery<OrphanedFile[]>({
    queryKey: ["/api/admin/media/orphaned"],
    queryFn: () => apiRequest("GET", "/api/admin/media/orphaned"),
  });

  // Nettoyer les fichiers orphelins
  const cleanupMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      return apiRequest("DELETE", "/api/admin/media/cleanup", { fileIds });
    },
    onSuccess: (result: { deletedCount: number; freedSpace: string }) => {
      toast({ 
        title: "Nettoyage terminé", 
        description: `${result.deletedCount} fichiers supprimés, ${result.freedSpace} libérés`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media/orphaned"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors du nettoyage", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Optimiser les images
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/media/optimize");
    },
    onSuccess: (result: { optimizedCount: number; savedSpace: string }) => {
      toast({ 
        title: "Optimisation terminée", 
        description: `${result.optimizedCount} images optimisées, ${result.savedSpace} économisés`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media/stats"] });
      setIsOptimizing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de l'optimisation", 
        description: error.message,
        variant: "destructive" 
      });
      setIsOptimizing(false);
    }
  });

  const handleCleanupAll = () => {
    if (!orphanedFiles) return;
    const fileIds = orphanedFiles.map(file => file.id);
    cleanupMutation.mutate(fileIds);
  };

  const handleOptimizeImages = () => {
    setIsOptimizing(true);
    optimizeMutation.mutate();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isStatsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des Médias</h2>
        <p className="text-muted-foreground">
          Optimisez l'espace de stockage et gérez vos fichiers médias
        </p>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fichiers</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground">
              Fichiers médias stockés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace Utilisé</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats?.totalSize || "0 MB"}</div>
            <p className="text-xs text-muted-foreground">
              Stockage des médias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fichiers Orphelins</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mediaStats?.orphanedFiles || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              À supprimer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images à Optimiser</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mediaStats?.optimizableImages || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Gain possible
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Utilisation du disque */}
      {mediaStats?.diskUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Utilisation du Disque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Espace utilisé: {mediaStats.diskUsage.used}</span>
                <span>Disponible: {mediaStats.diskUsage.available}</span>
              </div>
              <Progress 
                value={mediaStats.diskUsage.percentage} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                {mediaStats.diskUsage.percentage.toFixed(1)}% de l'espace disque utilisé
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions de maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Nettoyage des Fichiers
            </CardTitle>
            <CardDescription>
              Supprimez les fichiers inutilisés pour libérer de l'espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orphanedFiles && orphanedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {orphanedFiles.length} fichiers orphelins trouvés
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {orphanedFiles.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex justify-between items-center text-xs">
                      <span className="truncate">{file.filename}</span>
                      <Badge variant="outline">{file.size}</Badge>
                    </div>
                  ))}
                  {orphanedFiles.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ...et {orphanedFiles.length - 5} autres
                    </div>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Nettoyer Tous les Fichiers Orphelins
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer le nettoyage</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action va supprimer {orphanedFiles.length} fichiers orphelins.
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCleanupAll}
                        className="bg-destructive text-destructive-foreground"
                        disabled={cleanupMutation.isPending}
                      >
                        {cleanupMutation.isPending ? "Nettoyage..." : "Confirmer"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  Aucun fichier orphelin trouvé
                </div>
                <Button variant="outline" className="mt-2" onClick={() => 
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/media/orphaned"] })
                }>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyser à nouveau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Optimisation des Images
            </CardTitle>
            <CardDescription>
              Compressez vos images pour améliorer les performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mediaStats && mediaStats.optimizableImages > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {mediaStats.optimizableImages} images peuvent être optimisées
                </div>
                
                <Button 
                  onClick={handleOptimizeImages}
                  disabled={isOptimizing || optimizeMutation.isPending}
                  className="w-full"
                >
                  {isOptimizing || optimizeMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Optimisation en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Optimiser les Images
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  Toutes vos images sont déjà optimisées
                </div>
                <Button variant="outline" className="mt-2" onClick={() => 
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/media/stats"] })
                }>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vérifier à nouveau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conseils d'optimisation */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils d'Optimisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Bonnes Pratiques</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Utilisez des formats WebP pour une meilleure compression</li>
                <li>• Redimensionnez les images avant upload (max 1920px)</li>
                <li>• Supprimez régulièrement les fichiers inutilisés</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Maintenance Recommandée</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Nettoyage mensuel des fichiers orphelins</li>
                <li>• Optimisation hebdomadaire des nouvelles images</li>
                <li>• Surveillance de l'espace disque disponible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}