import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Smartphone, Check, X, Settings } from 'lucide-react';

interface PushNotificationManagerProps {
  className?: string;
  showCard?: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export default function PushNotificationManager({ 
  className = '', 
  showCard = true 
}: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  // VAPID public key (à remplacer par votre vraie clé)
  const VAPID_PUBLIC_KEY = 'BB1dd2Y35feHTzlnJLqa6dxlXGGQWMHNKpOFeIf4I2pAr6HIrRP5TyqRUGRuC0PqI66wXR3BrN8g-ahwmPkrO_Y';

  useEffect(() => {
    checkPushSupport();
    checkCurrentPermission();
    checkExistingSubscription();
    
    // Écouter les messages du service worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const handleSWMessage = (event: MessageEvent) => {
    console.log('📱 Message du SW:', event.data);
    
    if (event.data?.type === 'NOTIFICATION_CLICKED') {
      toast({
        title: "🎯 Notification cliquée",
        description: `Action: ${event.data.action || 'default'}`,
      });
    }
  };

  const checkPushSupport = () => {
    const supported = 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;
    
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('❌ Push notifications non supportées');
      toast({
        title: "❌ Non supporté",
        description: "Les notifications push ne sont pas supportées sur cet appareil.",
        variant: "destructive",
      });
    }
  };

  const checkCurrentPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const checkExistingSubscription = async () => {
    try {
      if (!navigator.serviceWorker) return;

      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      
      if (existingSub) {
        setSubscription({
          endpoint: existingSub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(existingSub.getKey('p256dh')!),
            auth: arrayBufferToBase64(existingSub.getKey('auth')!)
          }
        });
        setIsSubscribed(true);
        console.log('✅ Abonnement existant trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur vérification abonnement:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées');
      }

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
        setPermission(permission);
      }

      if (permission === 'granted') {
        toast({
          title: "✅ Autorisé",
          description: "Notifications autorisées avec succès!",
        });
        return true;
      } else if (permission === 'denied') {
        toast({
          title: "❌ Refusé",
          description: "Vous avez refusé les notifications. Vous pouvez les réactiver dans les paramètres du navigateur.",
          variant: "destructive",
        });
        return false;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur demande permission:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de demander la permission pour les notifications.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: "❌ Non supporté",
        description: "Les notifications push ne sont pas supportées.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Demander permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return;
      }

      // 2. Obtenir service worker
      const registration = await navigator.serviceWorker.ready;

      // 3. Créer abonnement push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 4. Extraire les clés
      const p256dhKey = pushSubscription.getKey('p256dh');
      const authKey = pushSubscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Impossible d\'extraire les clés de l\'abonnement');
      }

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        p256dhKey: arrayBufferToBase64(p256dhKey),
        authKey: arrayBufferToBase64(authKey),
        userAgent: navigator.userAgent,
      };

      // 5. Envoyer au serveur
      const response = await fetch('/api/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur serveur: ${error}`);
      }

      const result = await response.json();
      console.log('✅ Abonnement créé:', result);

      // 6. Mettre à jour l'état
      setSubscription({
        endpoint: subscriptionData.endpoint,
        keys: {
          p256dh: subscriptionData.p256dhKey,
          auth: subscriptionData.authKey
        }
      });
      setIsSubscribed(true);

      toast({
        title: "🔔 Abonné aux notifications!",
        description: "Vous recevrez maintenant des notifications push de Dounie Cuisine.",
      });

    } catch (error) {
      console.error('❌ Erreur abonnement:', error);
      toast({
        title: "❌ Erreur d'abonnement",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      // 1. Désabonner côté navigateur
      const registration = await navigator.serviceWorker.ready;
      const pushSub = await registration.pushManager.getSubscription();
      
      if (pushSub) {
        await pushSub.unsubscribe();
      }

      // 2. Informer le serveur
      const response = await fetch('/api/push-notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('⚠️ Erreur désabonnement serveur:', await response.text());
      }

      // 3. Mettre à jour l'état
      setSubscription(null);
      setIsSubscribed(false);

      toast({
        title: "🔕 Désabonné",
        description: "Vous ne recevrez plus de notifications push.",
      });

    } catch (error) {
      console.error('❌ Erreur désabonnement:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de se désabonner des notifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!isSubscribed || !subscription) {
      toast({
        title: "❌ Non abonné",
        description: "Vous devez d'abord vous abonner aux notifications.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          title: "🧪 Test de Dounie Cuisine",
          body: "Ceci est une notification de test. Si vous la voyez, tout fonctionne parfaitement! 🎉",
          icon: "/images/logo-192.png",
          badge: "/images/badge-72.png",
          data: {
            url: "/",
            action: "test"
          }
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur: ${error}`);
      }

      toast({
        title: "🧪 Test envoyé!",
        description: "Une notification de test a été envoyée à votre appareil.",
      });

    } catch (error) {
      console.error('❌ Erreur test:', error);
      toast({
        title: "❌ Erreur de test",
        description: error instanceof Error ? error.message : "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions utilitaires
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="destructive">Non supporté</Badge>;
    }
    if (permission === 'denied') {
      return <Badge variant="destructive">Refusé</Badge>;
    }
    if (isSubscribed) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
    }
    return <Badge variant="secondary">Inactif</Badge>;
  };

  const renderContent = () => (
    <div className="space-y-6">
      {/* Statut */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          {isSubscribed ? <Bell className="h-5 w-5 text-green-600" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
          <div>
            <h4 className="font-medium">Notifications Push</h4>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Vous êtes abonné aux notifications' : 'Non abonné aux notifications'}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Informations techniques (mode développement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Informations techniques
          </h5>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>Support: {isSupported ? '✅' : '❌'}</li>
            <li>Permission: {permission}</li>
            <li>Service Worker: {'serviceWorker' in navigator ? '✅' : '❌'}</li>
            <li>Push Manager: {'PushManager' in window ? '✅' : '❌'}</li>
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!isSubscribed ? (
          <Button
            onClick={subscribe}
            disabled={!isSupported || isLoading}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            {isLoading ? 'Activation...' : 'Activer les notifications'}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={sendTestNotification}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              Test notification
            </Button>
            <Button
              variant="destructive"
              onClick={unsubscribe}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Se désabonner
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (!showCard) {
    return <div className={className}>{renderContent()}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Recevez des notifications pour vos commandes et les dernières actualités
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
