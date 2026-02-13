import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSiteInfo } from "@/hooks/useSiteInfo";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CreditCard, MapPin, CheckCircle2, ShoppingCart, Package, ArrowLeft, ChefHat } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  apartment: string;
  city: string;
  postalCode: string;
  deliveryInstructions: string;
}

export default function Checkout() {
  const { items, clearCart, getTotalPrice, tip, tipPercentage, setTip, setTipPercentage } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [customTipInput, setCustomTipInput] = useState("");
  
  const { data: siteInfo } = useSiteInfo();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    street: "",
    apartment: "",
    city: "Montréal",
    postalCode: "",
    deliveryInstructions: "",
  });

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Square Payment States
  const [squareConfig, setSquareConfig] = useState<any>(null);
  const [squareCard, setSquareCard] = useState<any>(null);
  const [squarePayments, setSquarePayments] = useState<any>(null);

  // Redirect si panier vide
  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      setLocation("/menu");
    }
  }, [items, orderComplete, setLocation]);

  // Charger configuration Square
  useEffect(() => {
    const loadSquareConfig = async () => {
      try {
        const response = await fetch("/api/payments/square/config");
        const config = await response.json();
        setSquareConfig(config);
      } catch (error) {
        toast({ 
          title: "Erreur de configuration", 
          description: "Impossible de charger le système de paiement",
          variant: "destructive"
        });
      }
    };
    loadSquareConfig();
  }, [toast]);

  // Initialiser Square
  useEffect(() => {
    if (!squareConfig || squareCard) return;

    const initSquare = async () => {
      try {
        // Charger le SDK Square
        if (!(window as any).Square) {
          const script = document.createElement('script');
          script.src = squareConfig.sdkUrl;
          script.onload = () => initializeSquarePayments();
          document.head.appendChild(script);
        } else {
          initializeSquarePayments();
        }
      } catch (error) {
        toast({ 
          title: "Erreur de paiement", 
          description: "Impossible d'initialiser le système de paiement",
          variant: "destructive"
        });
      }
    };

    const initializeSquarePayments = async () => {
      const payments = (window as any).Square.payments(squareConfig.applicationId, squareConfig.locationId);
      setSquarePayments(payments);

      const card = await payments.card();
      await card.attach('#card-container');
      setSquareCard(card);
    };

    initSquare();
  }, [squareConfig, squareCard, toast]);

  const calculateDeliveryFee = () => {
    return orderType === "delivery" ? 5.00 : 0;
  };

  const calculateTaxes = (subtotal: number) => {
    const tpsRate = 0.05; // 5% TPS
    const tvqRate = 0.09975; // 9.975% TVQ
    
    const tps = subtotal * tpsRate;
    const tvq = subtotal * tvqRate;
    
    return { tps, tvq, total: tps + tvq };
  };

  const calculateTotal = () => {
    const subtotal = getTotalPrice();
    const deliveryFee = calculateDeliveryFee();
    const taxes = calculateTaxes(subtotal + deliveryFee);
    return subtotal + deliveryFee + taxes.total + tip;
  };

  const handleTipChange = (percentage: number) => {
    const subtotal = getTotalPrice() + calculateDeliveryFee();
    const tipAmount = subtotal * (percentage / 100);
    setTipPercentage(percentage);
    setTip(tipAmount);
    setCustomTipInput("");
  };

  const handleCustomTip = (value: string) => {
    setCustomTipInput(value);
    const amount = parseFloat(value) || 0;
    setTip(amount);
    setTipPercentage(0);
  };

  const processPayment = useMutation({
    mutationFn: async () => {
      if (!squareCard) throw new Error("Système de paiement non initialisé");

      const tokenResult = await squareCard.tokenize();
      if (tokenResult.status !== 'OK') {
        throw new Error(tokenResult.errors?.[0]?.message || "Erreur de tokenization");
      }

      const orderData = {
        type: orderType,
        customerInfo: formData,
        items: items,
        tip: tip,
        deliveryFee: calculateDeliveryFee(),
        total: calculateTotal()
      };

      return apiRequest("POST", "/api/payments/square/process", {
        sourceId: tokenResult.token,
        amount: Math.round(calculateTotal() * 100), // en cents
        currency: "CAD",
        orderData
      });
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber || "N/A");
      setOrderComplete(true);
      clearCart();
      toast({ title: "Commande confirmée !", description: "Votre paiement a été traité avec succès." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur de paiement", 
        description: error.message || "Une erreur est survenue lors du paiement",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast({ 
        title: "Informations manquantes", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (orderType === "delivery" && (!formData.street || !formData.city || !formData.postalCode)) {
      toast({ 
        title: "Adresse incomplète", 
        description: "Veuillez remplir votre adresse de livraison",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      await processPayment.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex flex-col relative">
        {/* Motifs décoratifs pour la page de confirmation */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-orange-100/30 to-transparent"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-white/50 to-transparent"></div>
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/50 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10">
          <TopInfoBar />
          <Navigation />
          <div className="flex-1 flex items-center justify-center py-20 pt-[7.5rem] md:pt-[8.75rem] lg:pt-36">
            <Card className="max-w-lg mx-auto shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-primary">🎉 Commande confirmée !</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Numéro de commande :</p>
                <p className="text-2xl font-bold text-primary">{orderNumber}</p>
              </div>
              <div className="text-left space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Statut du paiement :</span>
                  <Badge className="bg-green-100 text-green-800 border-green-300">✅ Payé</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Statut de la commande :</span>
                  <Badge variant="secondary">⏳ En préparation</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Temps estimé :</span>
                  <span className="text-sm font-medium">30-45 minutes</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-700">
                  📧 Un email de confirmation a été envoyé avec tous les détails de votre commande.
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={() => setLocation("/")} className="w-full bg-primary hover:bg-primary/90">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/menu")} 
                  className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Continuer mes achats
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          <Footer />
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryFee = calculateDeliveryFee();
  const taxes = calculateTaxes(subtotal + deliveryFee);
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex flex-col relative">
      {/* Motifs décoratifs en arrière-plan inspirés du thème Dounie Cuisine */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Motifs oranges (côté gauche) */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-orange-100/30 to-transparent"></div>
        <div className="absolute top-20 left-10 w-80 h-80 bg-orange-200/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 left-32 w-48 h-48 bg-orange-300/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Motifs blancs (côté droit) */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-white/50 to-transparent"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-20 w-64 h-64 bg-orange-100/30 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
        
        {/* Éléments décoratifs cuisines */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-orange-200/15 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-white/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>
      
      <div className="relative z-10">
        <TopInfoBar />
        <Navigation />
        
        {/* Hero Section avec bouton retour */}
        <section className="relative bg-gradient-to-r from-primary via-primary/90 to-accent text-white py-6 md:py-8 pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 pb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/menu")}
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au menu
              </Button>
            </div>
            
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Finaliser la commande</h1>
              <p className="text-lg text-white/90 mb-4">Dernière étape avant de savourer vos plats</p>
            </div>
          </div>
        </section>
        
        <div className="container mx-auto px-4 py-8 max-w-7xl -mt-8 relative z-10">
        
        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          {/* Colonne gauche - Informations */}
          <div className="space-y-8 xl:col-span-2">
            {/* Type de commande */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50/80 to-orange-100/50">
                <CardTitle className="flex items-center gap-3 text-primary font-semibold">
                  <Package className="w-5 h-5" />
                  Type de commande
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup
                  value={orderType}
                  onValueChange={(value) => setOrderType(value as "delivery" | "pickup")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
                    <RadioGroupItem value="delivery" id="delivery" className="border-primary text-primary" />
                    <Label htmlFor="delivery" className="cursor-pointer">Livraison (+5.00$)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
                    <RadioGroupItem value="pickup" id="pickup" className="border-primary text-primary" />
                    <Label htmlFor="pickup" className="cursor-pointer">Ramassage</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Informations client */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50/80 to-orange-100/50">
                <CardTitle className="text-primary font-semibold">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            {orderType === "delivery" && (
              <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50/80 to-orange-100/50">
                  <CardTitle className="flex items-center gap-3 text-primary font-semibold">
                    <MapPin className="w-5 h-5" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Adresse *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      required={orderType === "delivery"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apartment">Appartement/Bureau</Label>
                    <Input
                      id="apartment"
                      value={formData.apartment}
                      onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required={orderType === "delivery"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Code postal *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        required={orderType === "delivery"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="instructions">Instructions de livraison</Label>
                    <Textarea
                      id="instructions"
                      value={formData.deliveryInstructions}
                      onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                      placeholder="Instructions spéciales pour la livraison..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pourboire */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50/80 to-orange-100/50">
                <CardTitle className="text-primary font-semibold">Pourboire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[15, 18, 20, 25].map((percentage) => (
                    <Button
                      key={percentage}
                      type="button"
                      variant={tipPercentage === percentage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTipChange(percentage)}
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="customTip">Montant personnalisé</Label>
                  <Input
                    id="customTip"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customTipInput}
                    onChange={(e) => handleCustomTip(e.target.value)}
                  />
                </div>
                {tip > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Pourboire : {tip.toFixed(2)}$ CAD
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite - Résumé et paiement */}
          <div className="space-y-6">
            {/* Résumé de commande */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50/80 to-orange-100/50">
                <CardTitle className="flex items-center gap-3 text-primary font-semibold">
                  <ShoppingCart className="w-5 h-5" />
                  Résumé de la commande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={`${item.dish.id}-${index}`} className="flex justify-between">
                      <span className="flex-1">
                        {item.dish.name} {item.variant && `(${item.variant.label})`} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {(() => {
                          const variantPrice = item.variant?.price ? parseFloat(item.variant.price.toString()) : 0;
                          const dishPrice = item.dish.price ? parseFloat(item.dish.price.toString()) : 0;
                          const price = variantPrice || dishPrice;
                          return (price * item.quantity).toFixed(2);
                        })()}$
                      </span>
                    </div>
                  ))}
                  <hr />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(2)}$ CAD</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Livraison</span>
                        <span>{deliveryFee.toFixed(2)}$ CAD</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>TPS (5%)</span>
                      <span>{taxes.tps.toFixed(2)}$ CAD</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>TVQ (9.975%)</span>
                      <span>{taxes.tvq.toFixed(2)}$ CAD</span>
                    </div>
                    {tip > 0 && (
                      <div className="flex justify-between">
                        <span>Pourboire</span>
                        <span>{tip.toFixed(2)}$ CAD</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{total.toFixed(2)}$ CAD</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paiement */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-orange-200/50 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50/80 to-orange-100/50">
                <CardTitle className="flex items-center gap-3 text-primary font-semibold">
                  <CreditCard className="w-5 h-5" />
                  Paiement par carte
                </CardTitle>
              </CardHeader>
              <CardContent>
                {squareConfig && (
                  <div className="mb-4">
                    <Badge variant={squareConfig.environment === 'sandbox' ? 'secondary' : 'default'} className="mb-2">
                      {squareConfig.environment === 'sandbox' ? 'Mode Test' : 'Mode Production'}
                    </Badge>
                    {squareConfig.environment === 'sandbox' && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                        💳 Utilisez la carte test : <strong>4111 1111 1111 1111</strong>
                      </p>
                    )}
                  </div>
                )}
                
                <div id="card-container" className="border-2 border-dashed border-orange-200 rounded-lg p-4 min-h-[60px] mb-4 bg-gradient-to-br from-orange-50/30 to-white">
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary via-orange-600 to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 shadow-xl hover:shadow-orange-300/50 transition-all duration-300" 
                  disabled={isProcessing || !squareCard}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payer {total.toFixed(2)}$ CAD
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
