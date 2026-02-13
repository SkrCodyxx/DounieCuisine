import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mapSiteInfoApiToForm, mapFormToSiteInfoApi } from "@/lib/siteInfoMapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, AlertTriangle, Lock, Users, Wrench } from "lucide-react";
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

interface SecurityInfo {
  maintenanceMode: boolean;
  onlineOrderingEnabled: boolean;
  reservationsEnabled: boolean;
  newsletterEnabled: boolean;
}

export default function SecuritySettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<SecurityInfo>({
    maintenanceMode: false,
    onlineOrderingEnabled: true,
    reservationsEnabled: true,
    newsletterEnabled: true
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
        maintenanceMode: mappedData.maintenanceMode === true,
        onlineOrderingEnabled: mappedData.onlineOrderingEnabled !== false,
        reservationsEnabled: mappedData.reservationsEnabled !== false,
        newsletterEnabled: mappedData.newsletterEnabled !== false
      });
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: Partial<SecurityInfo>) => 
      apiRequest("PATCH", "/api/admin/site-info", {
        maintenance_mode: data.maintenanceMode,
        online_ordering_enabled: data.onlineOrderingEnabled,
        reservations_enabled: data.reservationsEnabled,
        newsletter_enabled: data.newsletterEnabled
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "Paramètres de sécurité sauvegardés",
        description: "Les paramètres de sécurité et permissions ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres de sécurité.",
      });
    }
  });

  const handleToggle = (field: keyof SecurityInfo, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfoMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres de sécurité
          </CardTitle>
          <CardDescription>
            Gestion de la sécurité, mode maintenance et permissions
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
          <Shield className="h-5 w-5" />
          Paramètres de sécurité
        </CardTitle>
        <CardDescription>
          Gestion de la sécurité, mode maintenance et permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode maintenance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Mode maintenance
            </h3>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Mode maintenance
                  </Label>
                  <p className="text-sm text-gray-500">
                    Désactive temporairement l'accès public au site pour maintenance
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {formData.maintenanceMode && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      ACTIF
                    </Badge>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        type="button"
                        variant={formData.maintenanceMode ? "destructive" : "outline"}
                        size="sm"
                      >
                        {formData.maintenanceMode ? "Désactiver" : "Activer"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {formData.maintenanceMode ? "Désactiver" : "Activer"} le mode maintenance
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {formData.maintenanceMode 
                            ? "Le site redeviendra accessible au public. Les commandes et réservations seront à nouveau possibles."
                            : "Le site sera temporairement inaccessible au public. Seuls les administrateurs pourront y accéder. Les clients verront un message de maintenance."
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggle("maintenanceMode", !formData.maintenanceMode)}
                          className={formData.maintenanceMode ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {formData.maintenanceMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Mode maintenance actif</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Le site public affiche actuellement une page de maintenance. 
                      Les clients ne peuvent pas passer de commandes ou faire de réservations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fonctionnalités publiques */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fonctionnalités publiques
            </h3>
            
            <div className="space-y-3">
              {/* Commandes en ligne */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Commandes en ligne
                    </Label>
                    <p className="text-sm text-gray-500">
                      Permet aux clients de passer des commandes sur le site
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={formData.onlineOrderingEnabled ? "default" : "secondary"}>
                      {formData.onlineOrderingEnabled ? "Activé" : "Désactivé"}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle("onlineOrderingEnabled", !formData.onlineOrderingEnabled)}
                    >
                      {formData.onlineOrderingEnabled ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Réservations */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Réservations
                    </Label>
                    <p className="text-sm text-gray-500">
                      Permet aux clients de faire des réservations d'événements
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={formData.reservationsEnabled ? "default" : "secondary"}>
                      {formData.reservationsEnabled ? "Activé" : "Désactivé"}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle("reservationsEnabled", !formData.reservationsEnabled)}
                    >
                      {formData.reservationsEnabled ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Newsletter
                    </Label>
                    <p className="text-sm text-gray-500">
                      Permet aux clients de s'abonner à la newsletter
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={formData.newsletterEnabled ? "default" : "secondary"}>
                      {formData.newsletterEnabled ? "Activé" : "Désactivé"}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle("newsletterEnabled", !formData.newsletterEnabled)}
                    >
                      {formData.newsletterEnabled ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sécurité avancée */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Sécurité avancée
            </h3>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Paramètres serveur</h4>
              <p className="text-sm text-blue-800 mb-3">
                Les paramètres de sécurité avancés sont configurés au niveau du serveur:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Rate limiting et protection DDoS</li>
                <li>• Chiffrement HTTPS avec certificats SSL</li>
                <li>• Sessions sécurisées et gestion des tokens</li>
                <li>• Validation et sanitisation des données</li>
                <li>• Protection CSRF et injection SQL</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Permissions administrateur</h4>
              <p className="text-sm text-green-800">
                La gestion des permissions administrateur (super admin, admin, permissions par module) 
                est accessible via la section "Gestion des utilisateurs" de l'interface d'administration.
              </p>
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
      </CardContent>
    </Card>
  );
}