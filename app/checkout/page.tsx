"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSiteInfo } from "@/hooks/use-site-info";
import { useCart } from "@/components/cart/cart-context";
import { Loader2, CreditCard, MapPin, CheckCircle2, ShoppingCart, Package, ArrowLeft, ChefHat } from "lucide-react";
import { apiRequest } from "@/lib/query-client";

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

export default function CheckoutPage() {
  const { items, clearCart, getTotalPrice, tip, tipPercentage, setTip, setTipPercentage } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const { data: siteInfo } = useSiteInfo();

  const [customTipInput, setCustomTipInput] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "", email: "", phone: "", street: "", apartment: "", city: "Montreal", postalCode: "", deliveryInstructions: "",
  });
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (items.length === 0 && !orderComplete) router.push("/takeout");
  }, [items, orderComplete, router]);

  const calculateDeliveryFee = () => (orderType === "delivery" ? 5.0 : 0);
  const calculateTaxes = (subtotal: number) => {
    const tps = subtotal * 0.05;
    const tvq = subtotal * 0.09975;
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
    setTipPercentage(percentage);
    setTip(subtotal * (percentage / 100));
    setCustomTipInput("");
  };

  const handleCustomTip = (value: string) => {
    setCustomTipInput(value);
    setTip(parseFloat(value) || 0);
    setTipPercentage(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast({ title: "Informations manquantes", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    if (orderType === "delivery" && (!formData.street || !formData.city || !formData.postalCode)) {
      toast({ title: "Adresse incomplete", description: "Veuillez remplir votre adresse de livraison", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const data = await apiRequest("POST", "/api/orders", {
        type: orderType, customerInfo: formData, items, tip, deliveryFee: calculateDeliveryFee(), total: calculateTotal(),
      });
      setOrderNumber(data.orderNumber ?? "N/A");
      setOrderComplete(true);
      clearCart();
      toast({ title: "Commande confirmee!", description: "Votre commande a ete enregistree." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-lg mx-auto shadow-2xl border-0">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-primary">Commande confirmee!</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Numero de commande :</p>
                <p className="text-2xl font-bold text-primary">{orderNumber}</p>
              </div>
              <div className="text-left space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Statut :</span>
                  <Badge className="bg-green-100 text-green-800 border-green-300">Confirmee</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Temps estime :</span>
                  <span className="text-sm font-medium">30-45 minutes</span>
                </div>
              </div>
              <div className="space-y-3">
                <Button onClick={() => router.push("/")} className="w-full">
                  <ChefHat className="w-4 h-4 mr-2" />{"Retour a l'accueil"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/takeout")} className="w-full">
                  <ShoppingCart className="w-4 h-4 mr-2" />Continuer mes achats
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryFee = calculateDeliveryFee();
  const taxes = calculateTaxes(subtotal + deliveryFee);
  const total = calculateTotal();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-accent text-white py-6 md:py-8 pb-8">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.push("/takeout")} className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />Retour au menu
            </Button>
          </div>
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Finaliser la commande</h1>
            <p className="text-lg text-white/90">Derniere etape avant de savourer vos plats</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            {/* Order Type */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-3 text-primary"><Package className="w-5 h-5" />Type de commande</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as "delivery" | "pickup")} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg border"><RadioGroupItem value="delivery" id="delivery" /><Label htmlFor="delivery">Livraison (+5.00$)</Label></div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border"><RadioGroupItem value="pickup" id="pickup" /><Label htmlFor="pickup">Ramassage</Label></div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader><CardTitle className="text-primary">Informations personnelles</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Nom complet *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                  <div><Label htmlFor="phone">Telephone *</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
                </div>
                <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {orderType === "delivery" && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-3 text-primary"><MapPin className="w-5 h-5" />Adresse de livraison</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label htmlFor="street">Adresse *</Label><Input id="street" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required /></div>
                  <div><Label htmlFor="apartment">Appartement/Bureau</Label><Input id="apartment" value={formData.apartment} onChange={(e) => setFormData({ ...formData, apartment: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="city">Ville *</Label><Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required /></div>
                    <div><Label htmlFor="postalCode">Code postal *</Label><Input id="postalCode" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} required /></div>
                  </div>
                  <div><Label htmlFor="instructions">Instructions de livraison</Label><Textarea id="instructions" value={formData.deliveryInstructions} onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })} /></div>
                </CardContent>
              </Card>
            )}

            {/* Tip */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-3 text-primary"><CreditCard className="w-5 h-5" />Pourboire</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[0, 10, 15, 20].map((pct) => (
                    <Button key={pct} type="button" variant={tipPercentage === pct ? "default" : "outline"} onClick={() => handleTipChange(pct)} className="w-full">
                      {pct === 0 ? "Aucun" : `${pct}%`}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="customTip">Montant personnalise ($)</Label>
                  <Input id="customTip" type="number" min="0" step="0.50" value={customTipInput} onChange={(e) => handleCustomTip(e.target.value)} placeholder="0.00" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader><CardTitle>Resume de la commande</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.dish.name} x{item.quantity}</span>
                    <span>${(parseFloat(String(item.variant?.price ?? item.dish.price ?? "0")) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>Sous-total</span><span>${subtotal.toFixed(2)}</span></div>
                  {deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Livraison</span><span>${deliveryFee.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-sm"><span>TPS (5%)</span><span>${taxes.tps.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span>TVQ (9.975%)</span><span>${taxes.tvq.toFixed(2)}</span></div>
                  {tip > 0 && <div className="flex justify-between text-sm"><span>Pourboire</span><span>${tip.toFixed(2)}</span></div>}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)} CAD</span></div>
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={isProcessing} onClick={handleSubmit}>
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</> : <>Confirmer la commande - ${total.toFixed(2)} CAD</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
