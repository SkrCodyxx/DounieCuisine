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
import { Save, Building2, FileImage, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SiteInfo {
  businessName: string;
  companyName: string;
  tagline: string;
  description: string;
  logoId: number | null;
  logoVisible: boolean;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  // Ajouts pour correspondre au mapper
  emailPrimary?: string;
  emailSecondary?: string;
  emailOrders?: string;
  phone1?: string;
  phone2?: string;
  whatsapp?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  googleMapsUrl?: string;
}

export default function GeneralSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<SiteInfo>({
    businessName: "",
    companyName: "",
    tagline: "",
    description: "",
    logoId: null,
    logoVisible: true,
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada"
  });

  const { data: siteInfo, isLoading, error } = useQuery({
    queryKey: ["/api/admin/site-info"],
    queryFn: () => apiRequest("GET", "/api/admin/site-info"),
  });

  // Mettre à jour formData quand les données arrivent
  React.useEffect(() => {
    if (siteInfo) {
      console.log("🔄 Données reçues de l'API:", siteInfo);
      const mappedData = mapSiteInfoApiToForm(siteInfo);
      setFormData(prev => ({
        ...prev,
        businessName: mappedData.businessName || prev.businessName,
        companyName: mappedData.companyName || prev.companyName,
        tagline: mappedData.tagline || prev.tagline,
        description: mappedData.description || prev.description,
        logoId: mappedData.logoId ?? prev.logoId,
        logoVisible: mappedData.logoVisible ?? prev.logoVisible,
        address: mappedData.address || prev.address,
        city: mappedData.city || prev.city,
        province: mappedData.province || prev.province,
        postalCode: mappedData.postalCode || prev.postalCode,
        country: mappedData.country || prev.country,
      }));
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateMutation = useMutation({
    mutationFn: (data: SiteInfo) => apiRequest("PATCH", "/api/admin/site-info", mapFormToSiteInfoApi(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "✅ Informations générales mises à jour",
        description: "Les paramètres ont été sauvegardés avec succès.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        variant: "destructive",
        title: "❌ Erreur de sauvegarde",
        description: "Impossible de sauvegarder les paramètres généraux.",
      });
    }
  });

  const handleInputChange = (field: keyof SiteInfo, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Paramètres généraux
          </CardTitle>
          <CardDescription>
            Configuration des informations de base du restaurant
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
          <Building2 className="h-5 w-5" />
          Paramètres généraux
        </CardTitle>
        <CardDescription>
          Configuration des informations de base du restaurant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom du restaurant *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  placeholder="ex: Restaurant Dounie Cuisine"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="ex: Les Entreprises Dounie Inc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Slogan</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange("tagline", e.target.value)}
                placeholder="ex: Cuisine authentique et savoureuse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez votre restaurant, votre histoire, votre spécialité..."
                rows={4}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Logo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoId">ID du logo (média)</Label>
                <Input
                  id="logoId"
                  type="number"
                  value={formData.logoId || ""}
                  onChange={(e) => handleInputChange("logoId", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="ex: 123"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="logoVisible"
                  checked={formData.logoVisible}
                  onChange={(e) => handleInputChange("logoVisible", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="logoVisible">Logo visible sur le site</Label>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="ex: 123 Rue Principale"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="ex: Montréal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleInputChange("province", e.target.value)}
                    placeholder="ex: Québec"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="ex: H1A 1A1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="Canada"
                />
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
              disabled={!hasChanges || updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}