import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export function PWAStatus() {
  const { 
    isOnline, 
    isInstalled, 
    canInstall, 
    updateAvailable, 
    installApp, 
    updateApp,
    clearCache 
  } = usePWA();
  
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    const success = await installApp();
    setInstalling(false);
    
    if (success) {
      console.log('✅ PWA: Application installée avec succès!');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Application Mobile
        </CardTitle>
        <CardDescription>
          Statut et gestion de l'application progressive
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statut de connectivité */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connectivité</span>
          <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? "En ligne" : "Hors ligne"}
          </Badge>
        </div>

        {/* Statut d'installation */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Installation</span>
          <Badge variant={isInstalled ? "default" : "secondary"} className="gap-1">
            {isInstalled ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {isInstalled ? "Installée" : "Web uniquement"}
          </Badge>
        </div>

        {/* Alerte mode hors ligne */}
        {!isOnline && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Mode hors ligne activé. Les données sont servies depuis le cache local.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton d'installation */}
        {canInstall && (
          <Button 
            onClick={handleInstall} 
            disabled={installing}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {installing ? "Installation..." : "Installer l'App"}
          </Button>
        )}

        {/* Mise à jour disponible */}
        {updateAvailable && (
          <Alert>
            <RotateCcw className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Mise à jour disponible</span>
              <Button size="sm" onClick={updateApp} className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Mettre à jour
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions de maintenance */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Maintenance</h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCache}
            className="w-full gap-2"
          >
            <Trash2 className="h-3 w-3" />
            Vider le cache
          </Button>
        </div>

        {/* Informations PWA */}
        {isInstalled && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Fonctionnalités</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>✅ Mode hors ligne</div>
              <div>✅ Installation native</div>
              <div>✅ Cache intelligent</div>
              <div>✅ Chargement rapide</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant léger pour la barre de notification
export function PWAStatusBar() {
  const { isOnline, updateAvailable, updateApp } = usePWA();

  if (!updateAvailable && isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-2 text-center text-sm">
      {updateAvailable && (
        <div className="flex items-center justify-center gap-2">
          <span>Mise à jour disponible</span>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={updateApp}
            className="h-6 px-2 text-xs"
          >
            Mettre à jour
          </Button>
        </div>
      )}
      
      {!isOnline && (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>Mode hors ligne - Contenu mis en cache</span>
        </div>
      )}
    </div>
  );
}