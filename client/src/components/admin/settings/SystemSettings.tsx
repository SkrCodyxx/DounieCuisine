import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mapSiteInfoApiToForm, mapFormToSiteInfoApi } from "@/lib/siteInfoMapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Database, HardDrive, Clock, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface SystemInfo {
  timezone: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export default function SystemSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [formData, setFormData] = useState<SystemInfo>({
    timezone: "America/Toronto",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: ""
  });

  const { data: siteInfo, isLoading, error } = useQuery({
    queryKey: ["/api/admin/site-info"],
    queryFn: () => apiRequest("GET", "/api/admin/site-info"),
  });

  // Mettre à jour formData quand les données arrivent
  React.useEffect(() => {
    if (siteInfo) {
      const mappedData = mapSiteInfoApiToForm(siteInfo);
      setFormData({
        timezone: mappedData.timezone || "America/Toronto",
        metaTitle: mappedData.metaTitle || "",
        metaDescription: mappedData.metaDescription || "",
        metaKeywords: mappedData.metaKeywords || ""
      });
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: Partial<SystemInfo>) => 
      apiRequest("PATCH", "/api/admin/site-info", {
        timezone: data.timezone,
        meta_title: data.metaTitle,
        meta_description: data.metaDescription,
        meta_keywords: data.metaKeywords
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "Paramètres système sauvegardés",
        description: "Les paramètres système ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres système.",
      });
    }
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/clear-cache"),
    onSuccess: () => {
      toast({
        title: "Cache vidé",
        description: "Le cache système a été vidé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vider le cache.",
      });
    }
  });

  const handleInputChange = (field: keyof SystemInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfoMutation.mutate(formData);
  };

  const handleClearCache = () => {
    setIsClearing(true);
    clearCacheMutation.mutate();
    setTimeout(() => setIsClearing(false), 2000);
  };

  const COMMON_TIMEZONES = [
    { value: "America/Toronto", label: "Toronto (Eastern)" },
    { value: "America/Montreal", label: "Montréal (Eastern)" }, 
    { value: "America/Vancouver", label: "Vancouver (Pacific)" },
    { value: "America/Edmonton", label: "Edmonton (Mountain)" },
    { value: "America/Winnipeg", label: "Winnipeg (Central)" },
    { value: "America/Halifax", label: "Halifax (Atlantic)" },
    { value: "America/St_Johns", label: "St. John's (Newfoundland)" }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres système
          </CardTitle>
          <CardDescription>
            Configuration du cache, performances et SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Paramètres système
        </CardTitle>
        <CardDescription>
          Configuration du cache, performances et SEO
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cache et performances */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache et performances
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Cache mémoire</h4>
                    <p className="text-sm text-gray-500">
                      Vide le cache en mémoire pour forcer le rechargement
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isClearing}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Vider
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Vider le cache</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action va vider le cache en mémoire. Cela peut temporairement 
                          ralentir le site le temps que les données soient rechargées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCache}>
                          Vider le cache
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Redémarrage automatique</h4>
                    <p className="text-sm text-gray-500">
                      Le serveur redémarre automatiquement en cas d'inactivité
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Optimisations automatiques</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Cache des requêtes fréquentes (site-info, menu, etc.)</li>
                <li>• Compression des images optimisée</li>
                <li>• Redémarrage automatique via PM2 en cas de surcharge</li>
                <li>• Rate limiting pour protéger contre les attaques</li>
              </ul>
            </div>
          </div>

          {/* Configuration système */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configuration système
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {COMMON_TIMEZONES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500">
                  Fuseau horaire utilisé pour l'affichage des dates et heures
                </p>
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Métadonnées SEO
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Titre de la page (meta title)</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                    placeholder="Restaurant Dounie Cuisine - Cuisine authentique à Montréal"
                    maxLength={60}
                  />
                  <p className="text-sm text-gray-500">
                    Titre affiché dans les résultats de recherche (max. 60 caractères)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Description de la page (meta description)</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                    placeholder="Découvrez notre cuisine authentique avec des plats traditionnels préparés avec des ingrédients frais. Commandez en ligne ou réservez votre table."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500">
                    Description affichée dans les résultats de recherche (max. 160 caractères)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Mots-clés (meta keywords)</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
                    placeholder="restaurant, cuisine authentique, montréal, livraison, réservation"
                  />
                  <p className="text-sm text-gray-500">
                    Mots-clés séparés par des virgules (optionnel, peu utilisé par les moteurs de recherche modernes)
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Conseils SEO</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Utilisez des titres uniques et descriptifs</li>
                  <li>• Incluez vos mots-clés principaux naturellement</li>
                  <li>• Évitez la sur-optimisation et restez naturel</li>
                  <li>• Mettez à jour régulièrement selon votre contenu</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div>
                {hasChanges && (
                  <Badge variant="secondary">
                    Modifications non sauvegardées
                  </Badge>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={!hasChanges || updateSiteInfoMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSiteInfoMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>

          {/* Informations système */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations système</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Serveur:</strong> Node.js + Express
                </div>
                <div>
                  <strong>Base de données:</strong> PostgreSQL
                </div>
                <div>
                  <strong>Cache:</strong> Mémoire + Redis (si configuré)
                </div>
                <div>
                  <strong>Processus:</strong> PM2 avec redémarrage automatique
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}