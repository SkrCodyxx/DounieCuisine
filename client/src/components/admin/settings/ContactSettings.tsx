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
import { Save, Phone, Mail, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContactInfo {
  phone1: string;
  phone1Label: string;
  phone2: string;
  phone2Label: string;
  phone3: string;
  phone3Label: string;
  whatsappNumber: string;
  emailPrimary: string;
  emailSecondary: string;
  emailSupport: string;
}

export default function ContactSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<ContactInfo>({
    phone1: "",
    phone1Label: "Principal",
    phone2: "",
    phone2Label: "Secondaire",
    phone3: "",
    phone3Label: "Autre",
    whatsappNumber: "",
    emailPrimary: "",
    emailSecondary: "",
    emailSupport: ""
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
        phone1: mappedData.phone1 || "",
        phone1Label: "Principal",
        phone2: mappedData.phone2 || "",
        phone2Label: "Secondaire", 
        phone3: "", // Pas dans l'API actuellement
        phone3Label: "Autre",
        whatsappNumber: mappedData.whatsapp || "",
        emailPrimary: mappedData.emailPrimary || "",
        emailSecondary: mappedData.emailSecondary || "",
        emailSupport: mappedData.emailOrders || ""
      });
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: Partial<ContactInfo>) => {
      const apiData = {
        phone1: data.phone1,
        phone2: data.phone2,
        whatsapp: data.whatsappNumber,
        emailPrimary: data.emailPrimary,
        emailSecondary: data.emailSecondary,
        emailOrders: data.emailSupport
      };
      return apiRequest("PATCH", "/api/admin/site-info", mapFormToSiteInfoApi(apiData));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "Informations de contact sauvegardées",
        description: "Les informations de contact ont été mises à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les informations de contact.",
      });
    }
  });

  const handleInputChange = (field: keyof ContactInfo, value: string) => {
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
            <Phone className="h-5 w-5" />
            Informations de contact
          </CardTitle>
          <CardDescription>
            Gestion des téléphones, emails et WhatsApp
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
          <Phone className="h-5 w-5" />
          Informations de contact
        </CardTitle>
        <CardDescription>
          Gestion des téléphones, emails et WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Téléphones */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Numéros de téléphone
            </h3>
            
            {/* Téléphone 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="phone1Label">Étiquette téléphone 1</Label>
                <Input
                  id="phone1Label"
                  value={formData.phone1Label}
                  onChange={(e) => handleInputChange("phone1Label", e.target.value)}
                  placeholder="ex: Principal"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="phone1">Numéro de téléphone 1</Label>
                <Input
                  id="phone1"
                  type="tel"
                  value={formData.phone1}
                  onChange={(e) => handleInputChange("phone1", e.target.value)}
                  placeholder="ex: (514) 555-0123"
                />
              </div>
            </div>

            {/* Téléphone 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="phone2Label">Étiquette téléphone 2</Label>
                <Input
                  id="phone2Label"
                  value={formData.phone2Label}
                  onChange={(e) => handleInputChange("phone2Label", e.target.value)}
                  placeholder="ex: Secondaire"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="phone2">Numéro de téléphone 2</Label>
                <Input
                  id="phone2"
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) => handleInputChange("phone2", e.target.value)}
                  placeholder="ex: (438) 555-0456"
                />
              </div>
            </div>

            {/* Téléphone 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="phone3Label">Étiquette téléphone 3</Label>
                <Input
                  id="phone3Label"
                  value={formData.phone3Label}
                  onChange={(e) => handleInputChange("phone3Label", e.target.value)}
                  placeholder="ex: Livraison"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="phone3">Numéro de téléphone 3</Label>
                <Input
                  id="phone3"
                  type="tel"
                  value={formData.phone3}
                  onChange={(e) => handleInputChange("phone3", e.target.value)}
                  placeholder="ex: (450) 555-0789"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </h3>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">Numéro WhatsApp</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                placeholder="ex: +15145550123"
              />
              <p className="text-sm text-gray-500">
                Incluez l'indicatif pays (ex: +1 pour Canada/États-Unis)
              </p>
            </div>
          </div>

          {/* Emails */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Adresses email
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailPrimary">Email principal</Label>
                <Input
                  id="emailPrimary"
                  type="email"
                  value={formData.emailPrimary}
                  onChange={(e) => handleInputChange("emailPrimary", e.target.value)}
                  placeholder="ex: info@dounierestaurant.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailSecondary">Email secondaire</Label>
                <Input
                  id="emailSecondary"
                  type="email"
                  value={formData.emailSecondary}
                  onChange={(e) => handleInputChange("emailSecondary", e.target.value)}
                  placeholder="ex: commandes@dounierestaurant.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSupport">Email support</Label>
              <Input
                id="emailSupport"
                type="email"
                value={formData.emailSupport}
                onChange={(e) => handleInputChange("emailSupport", e.target.value)}
                placeholder="ex: support@dounierestaurant.com"
              />
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