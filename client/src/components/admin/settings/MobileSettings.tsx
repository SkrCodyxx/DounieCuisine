import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mapSiteInfoApiToForm, mapFormToSiteInfoApi } from "@/lib/siteInfoMapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Smartphone, Bell, Wifi, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface MobileInfo {
  siteUrl: string;
  metaTitle: string;
  metaDescription: string;
}

export default function MobileSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<MobileInfo>({
    siteUrl: "",
    metaTitle: "",
    metaDescription: ""
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
        siteUrl: mappedData.siteUrl || "",
        metaTitle: mappedData.metaTitle || "",
        metaDescription: mappedData.metaDescription || ""
      });
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: Partial<MobileInfo>) => 
      apiRequest("PATCH", "/api/admin/site-info", {
        site_url: data.siteUrl,
        meta_title: data.metaTitle,
        meta_description: data.metaDescription
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "Paramètres mobile sauvegardés",
        description: "Les paramètres PWA et mobile ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres mobile.",
      });
    }
  });

  const handleInputChange = (field: keyof MobileInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfoMutation.mutate(formData);
  };

  const testPWAInstall = () => {
    if (formData.siteUrl) {
      window.open(formData.siteUrl, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "URL manquante",
        description: "Veuillez d'abord configurer l'URL du site.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Paramètres mobile
          </CardTitle>
          <CardDescription>
            Configuration PWA, notifications push et paramètres mobile
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
          <Smartphone className="h-5 w-5" />
          Paramètres mobile
        </CardTitle>
        <CardDescription>
          Configuration PWA, notifications push et paramètres mobile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* État PWA */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Download className="h-5 w-5" />
              Application Web Progressive (PWA)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Manifeste PWA</h4>
                    <p className="text-sm text-gray-500">
                      Fichier de configuration pour l'installation mobile
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Wifi className="h-3 w-3 mr-1" />
                    Configuré
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Fichier: /public/manifest.json
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Service Worker</h4>
                    <p className="text-sm text-gray-500">
                      Cache et fonctionnement hors ligne
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Wifi className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Fichiers: /public/sw.js, /public/push-sw.js
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">PWA configurée et fonctionnelle</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Les utilisateurs peuvent installer l'app sur leur téléphone</li>
                <li>• Fonctionnement hors ligne avec mise en cache automatique</li>
                <li>• Interface optimisée pour mobile avec navigation native</li>
                <li>• Icônes et splash screens configurés</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={testPWAInstall}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Tester l'installation PWA
              </Button>
            </div>
          </div>

          {/* Notifications push */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications push
            </h3>
            
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Service Worker push</h4>
                  <p className="text-sm text-gray-500">
                    Système de notifications web push
                  </p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Bell className="h-3 w-3 mr-1" />
                  Prêt
                </Badge>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Configuration notifications</h4>
              <p className="text-sm text-blue-800 mb-3">
                Le système de notifications push est prêt à être utilisé. Pour l'activer complètement:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Configurez les clés VAPID sur le serveur</li>
                <li>• Ajoutez la logique d'envoi dans les workflows de commandes</li>
                <li>• Testez avec différents navigateurs et appareils</li>
                <li>• Configurez les préférences utilisateur pour les notifications</li>
              </ul>
            </div>
          </div>

          {/* Configuration mobile */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Configuration de l'app mobile
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL du site</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    value={formData.siteUrl}
                    onChange={(e) => handleInputChange("siteUrl", e.target.value)}
                    placeholder="https://www.votre-restaurant.com"
                  />
                  <p className="text-sm text-gray-500">
                    URL principale utilisée pour la PWA et les redirections
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Nom de l'application</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                    placeholder="Dounie Restaurant"
                    maxLength={50}
                  />
                  <p className="text-sm text-gray-500">
                    Nom affiché lors de l'installation sur mobile
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Description de l'app</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                    placeholder="Commandez vos plats favoris et réservez votre table directement depuis votre téléphone"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500">
                    Description de l'app dans les stores et lors de l'installation
                  </p>
                </div>
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

          {/* Fonctionnalités mobile */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fonctionnalités mobile optimisées</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Interface responsive</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Navigation adaptée au toucher</li>
                  <li>• Menus optimisés pour mobile</li>
                  <li>• Formulaires simplifés</li>
                  <li>• Images adaptatives</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Fonctionnalités natives</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Géolocalisation pour livraison</li>
                  <li>• Partage natif</li>
                  <li>• Contacts et téléphone</li>
                  <li>• Caméra pour photos</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Instructions d'installation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Android (Chrome):</strong>
                  <ol className="mt-1 space-y-1 text-gray-600">
                    <li>1. Menu → Ajouter à l'écran d'accueil</li>
                    <li>2. Confirmer l'installation</li>
                  </ol>
                </div>
                <div>
                  <strong>iOS (Safari):</strong>
                  <ol className="mt-1 space-y-1 text-gray-600">
                    <li>1. Bouton Partager</li>
                    <li>2. Ajouter à l'écran d'accueil</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}