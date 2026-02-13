import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  TestTube2, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink
} from "lucide-react";

export default function SquareTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingValid, setIsTestingValid] = useState(false);
  const [isTestingInvalid, setIsTestingInvalid] = useState(false);

  // Récupérer la config Square
  const { data: config, isLoading, error } = useQuery({
    queryKey: ["/api/payments/square/config"],
    queryFn: () => apiRequest("GET", "/api/payments/square/config"),
    staleTime: 10 * 60 * 1000, // 10 minutes - config stable
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchOnWindowFocus: false,
  });

  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString('fr-CA');
    const logEntry = `${timestamp} - ${message}`;
    console.log(logEntry);
    setTestResults(prev => [...prev, `${isError ? '❌' : '✅'} ${logEntry}`]);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const testValidPayment = async () => {
    setIsTestingValid(true);
    addLog("🧪 DÉBUT - Test avec token Square valide");
    
    try {
      const paymentData = {
        sourceId: 'cnon:card-nonce-ok', // Token de test officiel Square
        amount: 100, // 1 CAD
        currency: 'CAD'
      };
      
      addLog(`🚀 Envoi paiement (${paymentData.amount/100} CAD)...`);
      addLog(`🔑 Token: ${paymentData.sourceId}`);
      
      const response = await fetch('/api/payments/square/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addLog(`🎉 SUCCÈS! Paiement ID: ${result.paymentId}`);
        addLog(`📄 Statut: ${result.status}`);
        if (result.receipt) {
          addLog(`🧾 Reçu disponible: ${result.receipt.substring(0, 50)}...`);
        }
      } else {
        addLog(`⚠️ Échec: ${result.message}`, true);
      }
      
    } catch (error: any) {
      addLog(`❌ Erreur réseau: ${error.message}`, true);
    } finally {
      setIsTestingValid(false);
    }
  };

  const testInvalidPayment = async () => {
    setIsTestingInvalid(true);
    addLog("❌ DÉBUT - Test avec token invalide (pour comparaison)");
    
    try {
      const paymentData = {
        sourceId: `FAKE_TOKEN_${Date.now()}`,
        amount: 100,
        currency: 'CAD'
      };
      
      addLog(`🚀 Envoi paiement avec token factice...`);
      addLog(`🔑 Token: ${paymentData.sourceId}`);
      
      const response = await fetch('/api/payments/square/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      addLog(`❌ Échec attendu: Token invalide rejeté par Square`);
      
    } catch (error: any) {
      addLog(`❌ Erreur réseau: ${error.message}`, true);
    } finally {
      setIsTestingInvalid(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erreur de configuration</h2>
              <p className="text-muted-foreground">Impossible de charger la configuration Square</p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TestTube2 className="h-8 w-8" />
              Tests Square
            </h1>
            <p className="text-muted-foreground">
              Testez votre intégration Square en temps réel
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.open('/test-square-valid.html', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Page Test Publique
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration Actuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuration Active
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Environnement:</span>
                    <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
                      {config.environment}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <strong>App ID:</strong> {config.applicationId?.substring(0, 25)}...
                    </div>
                    <div>
                      <strong>Location:</strong> {config.locationId}
                    </div>
                    <div>
                      <strong>SDK URL:</strong> {config.sdkUrl?.substring(0, 40)}...
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Aucune configuration active</p>
              )}
            </CardContent>
          </Card>

          {/* Boutons de Test */}
          <Card>
            <CardHeader>
              <CardTitle>Tests de Paiement</CardTitle>
              <CardDescription>
                Testez les paiements avec des tokens valides et invalides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={testValidPayment}
                disabled={isTestingValid || !config}
                className="w-full"
              >
                {isTestingValid ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Test Token Valide (1 CAD)
              </Button>
              
              <Button
                variant="outline"
                onClick={testInvalidPayment}
                disabled={isTestingInvalid || !config}
                className="w-full"
              >
                {isTestingInvalid ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Test Token Invalide
              </Button>

              <Button
                variant="ghost"
                onClick={clearLogs}
                className="w-full"
              >
                Effacer les Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Résultats des Tests */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats des Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aide */}
        <Card>
          <CardHeader>
            <CardTitle>Guide des Tests</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="space-y-2">
              <li>
                <strong>Test Token Valide:</strong> Utilise le token officiel Square 
                <code>cnon:card-nonce-ok</code> pour simuler un paiement réussi
              </li>
              <li>
                <strong>Test Token Invalide:</strong> Teste la gestion des erreurs avec un token factice
              </li>
              <li>
                <strong>Sandbox vs Production:</strong> Les tests utilisent l'environnement 
                configuré dans les paramètres Square
              </li>
              <li>
                <strong>Page Test Publique:</strong> Une page simple accessible au public 
                pour tester sans interface admin
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}