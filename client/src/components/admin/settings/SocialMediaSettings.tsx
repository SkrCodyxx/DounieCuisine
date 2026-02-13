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
import { Save, Share2, Facebook, Instagram, Twitter, Youtube, Linkedin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SocialMediaInfo {
  facebookUrl: string;
  facebookEnabled: boolean;
  instagramUrl: string;
  instagramEnabled: boolean;
  twitterUrl: string;
  twitterEnabled: boolean;
  youtubeUrl: string;
  youtubeEnabled: boolean;
  linkedinUrl: string;
  linkedinEnabled: boolean;
}

const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    placeholder: "https://www.facebook.com/votre-page",
    color: "text-blue-600"
  },
  {
    key: "instagram", 
    label: "Instagram",
    icon: Instagram,
    placeholder: "https://www.instagram.com/votre-compte",
    color: "text-pink-600"
  },
  {
    key: "twitter",
    label: "Twitter (X)",
    icon: Twitter,
    placeholder: "https://twitter.com/votre-compte",
    color: "text-blue-500"
  },
  {
    key: "youtube",
    label: "YouTube", 
    icon: Youtube,
    placeholder: "https://www.youtube.com/votre-chaine",
    color: "text-red-600"
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://www.linkedin.com/company/votre-entreprise",
    color: "text-blue-700"
  }
];

export default function SocialMediaSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<SocialMediaInfo>({
    facebookUrl: "",
    facebookEnabled: false,
    instagramUrl: "",
    instagramEnabled: false,
    twitterUrl: "",
    twitterEnabled: false,
    youtubeUrl: "",
    youtubeEnabled: false,
    linkedinUrl: "",
    linkedinEnabled: false
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
        facebookUrl: mappedData.facebookUrl || "",
        facebookEnabled: mappedData.facebookEnabled || false,
        instagramUrl: mappedData.instagramUrl || "",
        instagramEnabled: mappedData.instagramEnabled || false,
        twitterUrl: mappedData.twitterUrl || "",
        twitterEnabled: mappedData.twitterEnabled || false,
        youtubeUrl: mappedData.youtubeUrl || "",
        youtubeEnabled: mappedData.youtubeEnabled || false,
        linkedinUrl: mappedData.linkedinUrl || "",
        linkedinEnabled: mappedData.linkedinEnabled || false
      });
      setHasChanges(false);
    }
  }, [siteInfo]);

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: Partial<SocialMediaInfo>) => 
      apiRequest("PATCH", "/api/admin/site-info", {
        facebook_url: data.facebookUrl,
        facebookEnabled: data.facebookEnabled ? 1 : 0,
        instagram_url: data.instagramUrl,
        instagramEnabled: data.instagramEnabled ? 1 : 0,
        twitter_url: data.twitterUrl,
        twitterEnabled: data.twitterEnabled ? 1 : 0,
        youtube_url: data.youtubeUrl,
        linkedin_url: data.linkedinUrl
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      setHasChanges(false);
      toast({
        title: "Réseaux sociaux sauvegardés",
        description: "Les liens vers vos réseaux sociaux ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres des réseaux sociaux.",
      });
    }
  });

  const handleInputChange = (field: keyof SocialMediaInfo, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfoMutation.mutate(formData);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const testLink = (url: string) => {
    if (url && validateUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Réseaux sociaux
          </CardTitle>
          <CardDescription>
            Configuration des liens vers vos réseaux sociaux
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
          <Share2 className="h-5 w-5" />
          Réseaux sociaux
        </CardTitle>
        <CardDescription>
          Configuration des liens vers vos réseaux sociaux
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Entrez l'URL complète de vos profils (ex: https://www.facebook.com/votre-page)</li>
              <li>• Laissez vide les réseaux que vous n'utilisez pas</li>
              <li>• Activez l'affichage pour les réseaux que vous voulez montrer sur le site</li>
              <li>• Utilisez le bouton "Tester" pour vérifier que vos liens fonctionnent</li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-6">
            {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, placeholder, color }) => {
              const urlField = `${key}Url` as keyof SocialMediaInfo;
              const enabledField = `${key}Enabled` as keyof SocialMediaInfo;
              const urlValue = formData[urlField] as string;
              const enabledValue = formData[enabledField] as boolean;
              
              return (
                <div key={key} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${color}`} />
                    <h3 className="text-lg font-medium">{label}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-4 space-y-2">
                      <Label htmlFor={urlField}>URL {label}</Label>
                      <Input
                        id={urlField}
                        type="url"
                        value={urlValue}
                        onChange={(e) => handleInputChange(urlField, e.target.value)}
                        placeholder={placeholder}
                        className={!validateUrl(urlValue) ? "border-red-500" : ""}
                      />
                      {urlValue && !validateUrl(urlValue) && (
                        <p className="text-sm text-red-600">URL invalide</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {enabledField !== 'youtubeEnabled' && enabledField !== 'linkedinEnabled' && (
                        <>
                          <input
                            type="checkbox"
                            id={enabledField}
                            checked={enabledValue}
                            onChange={(e) => handleInputChange(enabledField, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={enabledField} className="text-sm">
                            Visible
                          </Label>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testLink(urlValue)}
                        disabled={!urlValue || !validateUrl(urlValue)}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Tester
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aperçu */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Aperçu des liens actifs</h3>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, color }) => {
                const urlField = `${key}Url` as keyof SocialMediaInfo;
                const enabledField = `${key}Enabled` as keyof SocialMediaInfo;
                const urlValue = formData[urlField] as string;
                const enabledValue = formData[enabledField] as boolean;
                
                const shouldShow = urlValue && validateUrl(urlValue) && 
                  (enabledField === 'youtubeEnabled' || enabledField === 'linkedinEnabled' || enabledValue);
                
                if (!shouldShow) return null;
                
                return (
                  <div key={key} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant="secondary" className="text-xs">Actif</Badge>
                  </div>
                );
              })}
              {SOCIAL_PLATFORMS.every(({ key }) => {
                const urlField = `${key}Url` as keyof SocialMediaInfo;
                const enabledField = `${key}Enabled` as keyof SocialMediaInfo;
                const urlValue = formData[urlField] as string;
                const enabledValue = formData[enabledField] as boolean;
                
                return !urlValue || !validateUrl(urlValue) || 
                  (!enabledValue && enabledField !== 'youtubeEnabled' && enabledField !== 'linkedinEnabled');
              }) && (
                <div className="text-sm text-gray-500 italic">
                  Aucun réseau social configuré
                </div>
              )}
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