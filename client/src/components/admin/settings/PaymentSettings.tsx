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
import { Save, CreditCard, Calculator, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentInfo {
  tpsRate: string;
  tvqRate: string;
  deliveryRadiusKm: string;
}

export default function PaymentSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<PaymentInfo>({
    tpsRate: "0.050",
    tvqRate: "0.09975",
    deliveryRadiusKm: "15.00"
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
        tpsRate: mappedData.tpsRate || "0.050",
        tvqRate: mappedData.tvqRate || "0.09975",
        deliveryRadiusKm: mappedData.deliveryRadiusKm || "15.00"
      });
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: Partial<PaymentInfo>) => 
      apiRequest("PATCH", "/api/admin/site-info", {
        tps_rate: data.tpsRate,
        tvq_rate: data.tvqRate,
        delivery_radius_km: data.deliveryRadiusKm
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "Paramètres de paiement sauvegardés",
        description: "Les paramètres de taxes et livraison ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres de paiement.",
      });
    }
  });

  const handleInputChange = (field: keyof PaymentInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfoMutation.mutate(formData);
  };

  const calculateTotalRate = () => {
    const tps = parseFloat(formData.tpsRate) || 0;
    const tvq = parseFloat(formData.tvqRate) || 0;
    return ((tps + tvq) * 100).toFixed(3);
  };

  const setPresetTaxRates = (preset: 'quebec' | 'canada' | 'zero') => {
    switch (preset) {
      case 'quebec':
        setFormData(prev => ({ ...prev, tpsRate: "0.050", tvqRate: "0.09975" }));
        break;
      case 'canada':
        setFormData(prev => ({ ...prev, tpsRate: "0.050", tvqRate: "0.000" }));
        break;
      case 'zero':
        setFormData(prev => ({ ...prev, tpsRate: "0.000", tvqRate: "0.000" }));
        break;
    }
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paramètres de paiement
          </CardTitle>
          <CardDescription>
            Configuration des taxes et frais de livraison
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
          <CreditCard className="h-5 w-5" />
          Paramètres de paiement
        </CardTitle>
        <CardDescription>
          Configuration des taxes et frais de livraison
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configuration Square */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configuration Square Payment
            </h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Les paramètres Square Payment (clés API, mode sandbox, etc.) sont configurés via les variables d'environnement sur le serveur. 
                Contactez votre administrateur système pour modifier ces paramètres.
              </p>
            </div>
          </div>

          {/* Taxes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Taxes
            </h3>

            {/* Raccourcis taxes */}
            <div className="space-y-2">
              <Label>Raccourcis taxes</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetTaxRates('quebec')}
                >
                  Québec (TPS + TVQ)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetTaxRates('canada')}
                >
                  Canada (TPS seulement)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetTaxRates('zero')}
                >
                  Aucune taxe
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpsRate">Taux TPS/GST</Label>
                <Input
                  id="tpsRate"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.tpsRate}
                  onChange={(e) => handleInputChange("tpsRate", e.target.value)}
                  placeholder="0.050"
                />
                <p className="text-sm text-gray-500">
                  Décimal (ex: 0.050 pour 5%)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tvqRate">Taux TVQ/PST</Label>
                <Input
                  id="tvqRate"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.tvqRate}
                  onChange={(e) => handleInputChange("tvqRate", e.target.value)}
                  placeholder="0.09975"
                />
                <p className="text-sm text-gray-500">
                  Décimal (ex: 0.09975 pour 9.975%)
                </p>
              </div>
            </div>

            {/* Calculateur de taxes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Aperçu des taxes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>TPS/GST:</span>
                  <span>{(parseFloat(formData.tpsRate || "0") * 100).toFixed(3)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>TVQ/PST:</span>
                  <span>{(parseFloat(formData.tvqRate || "0") * 100).toFixed(3)}%</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total des taxes:</span>
                  <span>{calculateTotalRate()}%</span>
                </div>
                <div className="mt-3 pt-2 border-t text-xs text-gray-600">
                  Exemple sur 100$: Total avec taxes = {(100 * (1 + parseFloat(formData.tpsRate || "0") + parseFloat(formData.tvqRate || "0"))).toFixed(2)}$
                </div>
              </div>
            </div>
          </div>

          {/* Livraison */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Livraison
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryRadiusKm">Rayon de livraison (km)</Label>
                <Input
                  id="deliveryRadiusKm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.deliveryRadiusKm}
                  onChange={(e) => handleInputChange("deliveryRadiusKm", e.target.value)}
                  placeholder="15.00"
                />
                <p className="text-sm text-gray-500">
                  Rayon maximum pour la livraison à domicile
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Note importante</h4>
                <p className="text-sm text-yellow-800">
                  Les frais de livraison spécifiques par zone sont configurés dans la section "Zones de livraison". 
                  Ce paramètre définit seulement le rayon maximum général.
                </p>
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Les taux de taxes sont appliqués automatiquement sur toutes les commandes</li>
              <li>• Square Payment gère automatiquement le calcul et la collecte des taxes</li>
              <li>• Les paramètres de livraison sont utilisés pour valider les adresses de livraison</li>
              <li>• Les frais de livraison réels sont définis par zone géographique</li>
            </ul>
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