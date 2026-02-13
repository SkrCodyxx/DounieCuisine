import { Link } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Package, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function CartPanel() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice, addItem } = useCart();

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  
  // Quebec tax rates
  const TPS_RATE = 0.05; // 5%
  const TVQ_RATE = 0.09975; // 9.975%
  
  const tps = subtotal * TPS_RATE;
  const tvq = subtotal * TVQ_RATE;
  const total = subtotal + tps + tvq;

  // Fetch suggested dishes (featured/popular items)
  const { data: suggestedDishes } = useQuery({
    queryKey: ['suggested-dishes'],
    queryFn: async () => {
      const res = await fetch('/api/dishes?isTakeout=1');
      if (!res.ok) throw new Error('Failed to fetch dishes');
      const dishes = await res.json();
      // Return featured dishes or first 2-3 available
      return dishes.filter((d: any) => d.featured && d.available).slice(0, 3);
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          {totalItems > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full bg-primary text-primary-foreground shadow-md animate-in zoom-in-50"
              data-testid="badge-cart-count"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col z-[70]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div>Votre Panier</div>
              {totalItems > 0 && (
                <div className="text-sm font-normal text-muted-foreground mt-0.5">
                  {totalItems} {totalItems === 1 ? "article" : "articles"}
                </div>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
                <div className="relative p-6 rounded-full bg-muted/30">
                  <Package className="w-16 h-16 text-muted-foreground/60" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold" data-testid="text-empty-cart">
                  Votre panier est vide
                </p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Découvrez nos délicieux plats haïtiens et ajoutez-les à votre panier
                </p>
              </div>
              <Link href="/menu">
                <Button size="lg" data-testid="button-browse-menu">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Parcourir le Menu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const itemKey = `${item.dish.id}-${item.variant?.id || 'default'}`;
                
                // Calculer le prix de base du plat (nouveau système flexible ou prix de base)
                let basePrice = 0;
                if (item.variant) {
                  // Utiliser le prix de la variante flexible sélectionnée
                  basePrice = parseFloat(item.variant.price as any || "0");
                } else {
                  // Plat sans variantes, utiliser le prix de base
                  basePrice = parseFloat(item.dish.price || "0");
                }
                
                // Ajouter le prix de l'accompagnement s'il existe
                const totalUnitPrice = basePrice + (item.selectedSide ? parseFloat(item.selectedSide.price as any || "0") : 0);
                
                return (
                <Card 
                  key={itemKey}
                  className="overflow-hidden hover-elevate"
                  data-testid={`cart-item-${itemKey}`}
                >
                  <div className="flex gap-3 p-2 md:p-3">
                    {((item.dish as any).image_id || item.dish.imageId) && (
                      <div className="relative flex-shrink-0">
                        <img
                          src={`/api/media/${(item.dish as any).image_id || item.dish.imageId}`}
                          alt={item.dish.name}
                          className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h4 className="font-semibold text-sm md:text-base leading-tight" data-testid={`text-dish-name-${itemKey}`}>
                            {item.dish.name}
                          </h4>
                          {item.variant && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {item.variant.label}
                            </Badge>
                          )}
                          {item.selectedSide && (
                            <Badge variant="outline" className="text-xs mt-1 ml-1">
                              + {item.selectedSide.name}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 -mt-1 -mr-1 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => removeItem(item.dish.id, item.variant?.id)}
                          data-testid={`button-remove-${itemKey}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm font-medium text-primary mb-2" data-testid={`text-dish-price-${itemKey}`}>
                        {totalUnitPrice.toFixed(2)} $ CAD
                      </p>
                      
                      {item.specialRequests && (
                        <p className="text-xs text-muted-foreground mb-2 italic bg-muted/30 px-2 py-1 rounded">
                          Note: {item.specialRequests}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-3 mt-auto">
                        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-background"
                            onClick={() => updateQuantity(item.dish.id, item.quantity - 1, item.variant?.id)}
                            data-testid={`button-decrease-${itemKey}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          
                          <span 
                            className="min-w-[2.5rem] text-center font-semibold text-sm"
                            data-testid={`text-quantity-${itemKey}`}
                          >
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-background"
                            onClick={() => updateQuantity(item.dish.id, item.quantity + 1, item.variant?.id)}
                            data-testid={`button-increase-${itemKey}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-base font-bold" data-testid={`text-item-total-${itemKey}`}>
                            {(totalUnitPrice * item.quantity).toFixed(2)} $ CAD
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4 mt-2">
            {/* Suggestions Section */}
            {suggestedDishes && suggestedDishes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Suggestions pour vous
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedDishes.map((dish: any) => (
                    <Card 
                      key={dish.id}
                      className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => {
                        addItem({
                          id: dish.id,
                          name: dish.name,
                          description: dish.description,
                          price: dish.price,
                          category: dish.category,
                          imageId: dish.imageId,
                          hasVariants: dish.hasVariants
                        } as any, 1);
                      }}
                    >
                      <div className="flex gap-3 items-center">
                        {((dish as any).image_id || dish.imageId) && (
                          <img
                            src={`/api/media/${(dish as any).image_id || dish.imageId}`}
                            alt={dish.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold truncate group-hover:text-orange-600 transition-colors">
                            {dish.name}
                          </h5>
                          <p className="text-xs text-muted-foreground truncate">
                            {dish.description}
                          </p>
                          <p className="text-sm font-bold text-orange-600 mt-1">
                            {parseFloat(dish.price || "0").toFixed(2)} $ CAD
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-orange-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card className="p-4 space-y-2.5 bg-muted/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium" data-testid="text-subtotal">{subtotal.toFixed(2)} $ CAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TPS (5%)</span>
                <span className="font-medium" data-testid="text-tps">{tps.toFixed(2)} $ CAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVQ (9.975%)</span>
                <span className="font-medium" data-testid="text-tvq">{tvq.toFixed(2)} $ CAD</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary" data-testid="text-total">
                  {total.toFixed(2)} $ CAD
                </span>
              </div>
            </Card>

            <Link href="/checkout">
              <Button className="w-full" size="lg" data-testid="button-checkout">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Passer à la caisse
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
