"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DietaryBadges from "@/components/dietary-badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/components/cart/cart-context";
import { getImageUrl } from "@/lib/image-utils";
import type { Dish, DishVariant, Side } from "@/types";

interface FlexibleDishCardProps {
  dish: Dish;
  featured?: boolean;
  onAddToCart?: () => void;
  showPricesInOptions?: boolean;
}

export default function FlexibleDishCard({
  dish,
  featured,
  onAddToCart,
  showPricesInOptions = true,
}: FlexibleDishCardProps) {
  const { addItem } = useCart();
  const [selectedSide, setSelectedSide] = useState<Side | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<DishVariant | undefined>();
  const [quantity, setQuantity] = useState(1);

  const { data: sides = [] } = useQuery<Side[]>({
    queryKey: ["dish-sides", dish.id],
    queryFn: () => fetch(`/api/dishes/${dish.id}/sides`).then((r) => r.json()),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: variants = [] } = useQuery<DishVariant[]>({
    queryKey: ["dish-variants", dish.id],
    queryFn: () => fetch(`/api/dishes/${dish.id}/variants`).then((r) => r.json()),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: dish.hasVariants ?? false,
  });

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const def = variants.find((v) => v.isDefault) ?? variants[0];
      setSelectedVariant(def);
    }
  }, [variants, selectedVariant]);

  const handleAddToCart = () => {
    if (sides.length > 0 && !selectedSide) return;
    addItem(dish, quantity, undefined, selectedVariant, selectedSide);
    setSelectedSide(undefined);
    setSelectedVariant(undefined);
    setQuantity(1);
    onAddToCart?.();
  };

  const calculatePrice = () => {
    let basePrice = selectedVariant
      ? parseFloat(String(selectedVariant.price))
      : parseFloat(dish.price ?? "0");
    if (selectedSide) basePrice += parseFloat(String(selectedSide.price ?? "0"));
    return basePrice.toFixed(2);
  };

  const priceWithSide = calculatePrice();
  const imageId = dish.imageId ?? null;

  return (
    <Card className="overflow-hidden transition-all duration-300 h-full flex flex-col bg-card border border-orange-100/50 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:border-orange-200 relative group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />

      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <img
          src={imageId ? getImageUrl(imageId) : "/images/placeholder-dish.jpg"}
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          crossOrigin="anonymous"
        />
        {featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg z-20">
            Vedette
          </Badge>
        )}
        {dish.preparationTime && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-orange-200 flex items-center gap-1 text-xs">
            <span>{dish.preparationTime} min</span>
          </div>
        )}
      </div>

      <CardContent className="p-6 flex-1 flex flex-col relative">
        <h3 className="text-xl font-semibold mb-2 relative z-10 group-hover:text-orange-600 transition-colors duration-300">
          {dish.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-3 flex-1">
          {dish.description}
        </p>

        {dish.ingredients && dish.ingredients.trim() !== "" && (
          <div className="mb-2">
            <p className="text-xs text-muted-foreground font-medium mb-1">Ingredients:</p>
            <p className="text-xs text-muted-foreground/80 line-clamp-2">{dish.ingredients}</p>
          </div>
        )}

        {dish.allergens && dish.allergens.trim() !== "" && (
          <div className="mb-3">
            <p className="text-xs text-destructive font-medium mb-1">Allergenes:</p>
            <p className="text-xs text-destructive/80">{dish.allergens}</p>
          </div>
        )}

        <DietaryBadges
          dietaryTags={dish.dietaryTags}
          allergensList={dish.allergensList}
          className="mb-3"
          size="sm"
        />

        <div className="mt-auto space-y-3">
          {variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {"Option "}<span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedVariant?.id.toString() ?? ""}
                onValueChange={(id) => setSelectedVariant(variants.find((v) => v.id === parseInt(id)))}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Choisir une option" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {variants.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {showPricesInOptions ? (
                        <span>
                          {v.label} - ${parseFloat(String(v.price)).toFixed(2)} CAD
                        </span>
                      ) : (
                        <span>{v.label}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sides.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {"Accompagnement "}<span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedSide?.id.toString() ?? ""}
                onValueChange={(id) => setSelectedSide(sides.find((s) => s.id === parseInt(id)))}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Choisir un accompagnement" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {sides.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      <span>
                        {s.name}
                        {parseFloat(String(s.price ?? "0")) > 0 &&
                          ` (+$${parseFloat(String(s.price)).toFixed(2)} CAD)`}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              {priceWithSide !== "0.00" ? (
                <>
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    ${priceWithSide} CAD
                  </span>
                  {selectedVariant && (
                    <span className="text-xs text-muted-foreground">{selectedVariant.label}</span>
                  )}
                </>
              ) : (
                <span className="text-lg font-medium text-muted-foreground">Prix sur demande</span>
              )}
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={(variants.length > 0 && !selectedVariant) || (sides.length > 0 && !selectedSide)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl"
            >
              Ajouter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
