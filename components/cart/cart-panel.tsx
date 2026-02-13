"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, Package, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import { getImageUrl } from "@/lib/image-utils";

export default function CartPanel() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice } = useCart();

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const TPS_RATE = 0.05;
  const TVQ_RATE = 0.09975;
  const tps = subtotal * TPS_RATE;
  const tvq = subtotal * TVQ_RATE;
  const total = subtotal + tps + tvq;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full bg-primary text-primary-foreground shadow-md">
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
                <p className="text-xl font-semibold">Votre panier est vide</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {"Decouvrez nos delicieux plats haitiens et ajoutez-les a votre panier"}
                </p>
              </div>
              <Link href="/menu">
                <Button size="lg">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Parcourir le Menu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const itemKey = `${item.dish.id}-${item.variant?.id || "default"}`;
                const basePrice = item.variant
                  ? parseFloat(String(item.variant.price || "0"))
                  : parseFloat(String(item.dish.price || "0"));
                const sidePrice = item.selectedSide ? item.selectedSide.price : 0;
                const unitPrice = basePrice + sidePrice;

                return (
                  <Card key={itemKey} className="overflow-hidden hover-elevate">
                    <div className="flex gap-3 p-2 md:p-3">
                      {item.dish.imageId && (
                        <div className="relative flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(item.dish) || ""}
                            alt={item.dish.name}
                            className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg shadow-sm"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-semibold text-sm md:text-base leading-tight">{item.dish.name}</h4>
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
                            className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeItem(item.dish.id, item.variant?.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <p className="text-sm font-medium text-primary mb-2">{unitPrice.toFixed(2)} $ CAD</p>

                        <div className="flex items-center justify-between gap-3 mt-auto">
                          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-background"
                              onClick={() => updateQuantity(item.dish.id, item.quantity - 1, item.variant?.id)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="min-w-[2.5rem] text-center font-semibold text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-background"
                              onClick={() => updateQuantity(item.dish.id, item.quantity + 1, item.variant?.id)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="text-base font-bold">{(unitPrice * item.quantity).toFixed(2)} $ CAD</div>
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
            <Card className="p-4 space-y-2.5 bg-muted/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{subtotal.toFixed(2)} $ CAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TPS (5%)</span>
                <span className="font-medium">{tps.toFixed(2)} $ CAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVQ (9.975%)</span>
                <span className="font-medium">{tvq.toFixed(2)} $ CAD</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{total.toFixed(2)} $ CAD</span>
              </div>
            </Card>
            <Link href="/checkout">
              <Button className="w-full" size="lg">
                <ShoppingBag className="w-4 h-4 mr-2" />
                {"Passer a la caisse"}
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
