import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Save, 
  CreditCard, 
  Power, 
  PowerOff, 
  Trash2, 
  TestTube2,
  Eye,
  EyeOff,
  ExternalLink
} from "lucide-react";

interface SquareConfig {
  id: number;
  environment: "sandbox" | "production";
  applicationId: string;
  locationId: string;
  isActive: boolean;
  hasAccessToken: boolean;
  hasWebhookSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SquareFormData {
  environment: "sandbox" | "production";
  applicationId: string;
  locationId: string;
  accessToken: string;
  webhookSecret: string;
}

export default function SquareSettings() {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [formData, setFormData] = useState<SquareFormData>({
    environment: "sandbox",
    applicationId: "",
    locationId: "",
    accessToken: "",
    webhookSecret: ""
  });

  // Récupérer les configurations Square
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ["/api/admin/square-settings"],
    queryFn: () => apiRequest("GET", "/api/admin/square-settings"),
  });

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: (data: SquareFormData) => 
      apiRequest("POST", "/api/admin/square-settings", data),
    onSuccess: () => {
      toast({ title: "✅ Configuration Square sauvegardée" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/square-settings"] });
      // Réinitialiser le formulaire
      setFormData({
        environment: "sandbox",
        applicationId: "",
        locationId: "",
        accessToken: "",
        webhookSecret: ""
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutation pour activer/désactiver
  const activateMutation = useMutation({
    mutationFn: (environment: "sandbox" | "production") => 
      apiRequest("POST", "/api/admin/square-settings/activate", { environment }),
    onSuccess: (data: any) => {
      toast({ title: `✅ ${data.message}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/square-settings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur d'activation", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: (environment: string) => 
      apiRequest("DELETE", `/api/admin/square-settings/${environment}`),
    onSuccess: () => {
      toast({ title: "✅ Configuration supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/square-settings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur de suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof SquareFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const activeConfig = configs?.find((config: SquareConfig) => config.isActive);

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Square</h2>
          <p className="text-muted-foreground">
            Gérez vos paramètres de paiement Square (Sandbox et Production)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeConfig && (
            <Badge variant={activeConfig.environment === "production" ? "default" : "secondary"}>
              Mode: {activeConfig.environment}
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/test-square-valid.html', '_blank')}
          >
            <TestTube2 className="h-4 w-4 mr-2" />
            Page de Test
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">Configurations</TabsTrigger>
          <TabsTrigger value="add">Ajouter/Modifier</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          {configs && configs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {configs.map((config: SquareConfig) => (
                <Card key={config.id} className={config.isActive ? "border-green-500" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {config.environment.toUpperCase()}
                      </div>
                      {config.isActive ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateMutation.mutate(config.environment)}
                          disabled={activateMutation.isPending}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          Activer
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <strong>App ID:</strong> {config.applicationId?.substring(0, 20)}...
                      </div>
                      <div>
                        <strong>Location:</strong> {config.locationId}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>Token:</strong> 
                        <Badge variant={config.hasAccessToken ? "default" : "destructive"}>
                          {config.hasAccessToken ? "Configuré" : "Manquant"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mis à jour: {new Date(config.updatedAt).toLocaleString('fr-CA')}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      {config.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateMutation.mutate(config.environment === "sandbox" ? "production" : "sandbox")}
                          disabled={activateMutation.isPending}
                        >
                          <PowerOff className="h-4 w-4 mr-2" />
                          Désactiver
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer la configuration {config.environment} ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(config.environment)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Aucune configuration Square</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez vos configurations Sandbox et Production
                </p>
                <Button onClick={() => setActiveTab("add")}>
                  Ajouter une configuration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter/Modifier Configuration Square</CardTitle>
              <CardDescription>
                Ajoutez ou mettez à jour vos paramètres Square pour sandbox ou production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environnement *</Label>
                    <select
                      id="environment"
                      value={formData.environment}
                      onChange={(e) => handleInputChange("environment", e.target.value as "sandbox" | "production")}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="sandbox">Sandbox (Test)</option>
                      <option value="production">Production (Live)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application ID *</Label>
                    <Input
                      id="applicationId"
                      value={formData.applicationId}
                      onChange={(e) => handleInputChange("applicationId", e.target.value)}
                      placeholder="sandbox-sq0idb-... ou sq0idp-..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location ID *</Label>
                    <Input
                      id="locationId"
                      value={formData.locationId}
                      onChange={(e) => handleInputChange("locationId", e.target.value)}
                      placeholder="LRFJN5J8XXVDX"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Access Token *</Label>
                    <div className="relative">
                      <Input
                        id="accessToken"
                        type={showTokens ? "text" : "password"}
                        value={formData.accessToken}
                        onChange={(e) => handleInputChange("accessToken", e.target.value)}
                        placeholder="EAAAl..."
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowTokens(!showTokens)}
                      >
                        {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="webhookSecret">Webhook Secret (optionnel)</Label>
                    <Input
                      id="webhookSecret"
                      type={showTokens ? "text" : "password"}
                      value={formData.webhookSecret}
                      onChange={(e) => handleInputChange("webhookSecret", e.target.value)}
                      placeholder="wbhk_..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        environment: "sandbox",
                        applicationId: "",
                        locationId: "",
                        accessToken: "",
                        webhookSecret: ""
                      });
                    }}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}