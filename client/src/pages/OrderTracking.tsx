import { useState } from "react";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderDetails {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  taxAmount: string;
  deliveryFee: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  deliveryAddress: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    dishId: number;
    quantity: number;
    unitPrice: string;
    specialRequests?: string;
  }>;
}

export default function OrderTracking() {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Commande introuvable",
            description: "Aucune commande ne correspond à ces informations.",
            variant: "destructive",
          });
          setOrderDetails(null);
        } else {
          throw new Error("Erreur lors de la recherche");
        }
        return;
      }

      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "preparing":
        return <Clock className="w-5 h-5" />;
      case "ready":
      case "in_transit":
        return <Truck className="w-5 h-5" />;
      case "delivered":
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "preparing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "ready":
      case "in_transit":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "delivered":
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      preparing: "En préparation",
      ready: "Prête",
      in_transit: "En livraison",
      delivered: "Livrée",
      completed: "Terminée",
      cancelled: "Annulée",
    };
    return statusMap[status] || status;
  };

  const getOrderTimeline = (status: string, createdAt: string, updatedAt: string) => {
    const timeline = [
      { label: "Commande reçue", status: "completed", time: createdAt },
      { label: "Confirmée", status: ["confirmed", "preparing", "ready", "in_transit", "delivered", "completed"].includes(status) ? "completed" : "pending", time: status === "confirmed" ? updatedAt : "" },
      { label: "En préparation", status: ["preparing", "ready", "in_transit", "delivered", "completed"].includes(status) ? "completed" : "pending", time: status === "preparing" ? updatedAt : "" },
      { label: "Prête", status: ["ready", "in_transit", "delivered", "completed"].includes(status) ? "completed" : "pending", time: status === "ready" ? updatedAt : "" },
      { label: "En livraison", status: ["in_transit", "delivered", "completed"].includes(status) ? "completed" : "pending", time: status === "in_transit" ? updatedAt : "" },
      { label: "Livrée", status: ["delivered", "completed"].includes(status) ? "completed" : "pending", time: status === "delivered" || status === "completed" ? updatedAt : "" },
    ];

    return timeline;
  };

  return (
    <div className="min-h-screen">
      <TopInfoBar />
      <Navigation />

      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Suivre ma Commande
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Entrez votre numéro de commande et votre email pour suivre l'état de votre commande
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Rechercher votre commande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Numéro de commande *</Label>
                    <Input
                      id="orderNumber"
                      required
                      placeholder="Ex: DC-2025-001"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      data-testid="input-order-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSearching}
                  data-testid="button-search-order"
                >
                  {isSearching ? "Recherche en cours..." : "Rechercher"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {orderDetails && (
            <div className="space-y-6">
              {/* Statut de la commande */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Commande {orderDetails.orderNumber}</CardTitle>
                    <Badge className={getStatusColor(orderDetails.status)}>
                      {getStatusIcon(orderDetails.status)}
                      <span className="ml-2">{getStatusText(orderDetails.status)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-semibold" data-testid="text-customer-name">{orderDetails.customerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date de commande</p>
                        <p className="font-semibold">{new Date(orderDetails.createdAt).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    {orderDetails.deliveryAddress && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Adresse de livraison</p>
                        <p className="text-sm whitespace-pre-line" data-testid="text-delivery-address">{orderDetails.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de suivi */}
              <Card>
                <CardHeader>
                  <CardTitle>Suivi de la commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {getOrderTimeline(orderDetails.status, orderDetails.createdAt, orderDetails.updatedAt).map((step, index, array) => (
                      <div key={index} className="flex gap-4 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            step.status === "completed" 
                              ? "bg-primary border-primary text-primary-foreground" 
                              : "bg-muted border-muted-foreground/20 text-muted-foreground"
                          }`}>
                            {step.status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Clock className="w-5 h-5" />
                            )}
                          </div>
                          {index < array.length - 1 && (
                            <div className={`w-0.5 h-12 ${
                              step.status === "completed" ? "bg-primary" : "bg-muted-foreground/20"
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h4 className={`font-semibold mb-1 ${
                            step.status === "completed" ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </h4>
                          {step.time && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(step.time).toLocaleDateString('fr-CA', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Résumé financier */}
              <Card>
                <CardHeader>
                  <CardTitle>Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sous-total</span>
                      <span>{(parseFloat(orderDetails.totalAmount) - parseFloat(orderDetails.taxAmount) - parseFloat(orderDetails.deliveryFee)).toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frais de livraison</span>
                      <span data-testid="text-order-delivery-fee">{parseFloat(orderDetails.deliveryFee).toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxes (TPS + TVQ)</span>
                      <span data-testid="text-order-tax">{parseFloat(orderDetails.taxAmount).toFixed(2)} CAD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span data-testid="text-order-total">{parseFloat(orderDetails.totalAmount).toFixed(2)} CAD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm pt-2">
                      <span>Statut du paiement</span>
                      <Badge variant={orderDetails.paymentStatus === "paid" ? "default" : "secondary"}>
                        {orderDetails.paymentStatus === "paid" ? "Payé" : "En attente"}
                      </Badge>
                    </div>
                  </div>

                  {orderDetails.specialInstructions && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-sm mb-2">Instructions spéciales</h4>
                      <p className="text-sm text-muted-foreground">{orderDetails.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
