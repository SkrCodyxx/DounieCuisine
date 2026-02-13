import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DietaryBadges from "@/components/DietaryBadges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dish, DishVariant } from "@shared/schema";
import { useCart } from "@/contexts/CartContext";

interface Side {
  id: number;
  name: string;
  description?: string;
  price: number;
}

interface FlexibleVariant {
  id: number;
  dish_id: number;  // Correspond au format snake_case de l'API
  label: string;
  price: string;
  is_default: number;
  display_order: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

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
  const [selectedVariant, setSelectedVariant] = useState<FlexibleVariant | undefined>();
  const [quantity, setQuantity] = useState(1);

  // Cache modéré - accompagnements changent occasionnellement
  const { data: sides = [] } = useQuery<Side[]>({
    queryKey: [`/api/dishes/${dish.id}/sides`],
    queryFn: () => fetch(`/api/dishes/${dish.id}/sides`).then(res => res.json()),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: false,
  });

  // Cache approprié - variantes peuvent changer mais pas très souvent
  const { data: variants = [], isLoading: isLoadingVariants, error: variantsError } = useQuery<FlexibleVariant[]>({
    queryKey: [`/api/dishes/${dish.id}/variants`],
    queryFn: () => fetch(`/api/dishes/${dish.id}/variants`).then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch variants: ${res.status}`);
      }
      return res.json();
    }),
    staleTime: 15 * 60 * 1000, // 15 minutes - variantes peuvent changer
    gcTime: 45 * 60 * 1000, // 45 minutes en cache
    refetchOnWindowFocus: false,
    enabled: (dish as any).has_variants || dish.hasVariants || false, // Vérifier le vrai flag
  });

  // Sélectionner la variante par défaut au chargement
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const defaultVariant = variants.find(v => v.is_default === 1) || variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [variants, selectedVariant]);

  // Constante spiceLevelMap supprimée - niveau d'épice ne s'affiche plus

  const handleAddToCart = () => {
    if (sides.length > 0 && !selectedSide) {
      // Si le plat a des accompagnements, forcer l'utilisateur à en sélectionner un
      return; // Le bouton doit être disabled, ne rien faire
    }
    
    // Mapper FlexibleVariant vers DishVariant pour compatibilité
    const mappedVariant = selectedVariant ? {
      ...selectedVariant,
      dishId: selectedVariant.dish_id
    } as any : undefined;
    
    addItem(dish, quantity, undefined, mappedVariant, selectedSide);
    setSelectedSide(undefined);
    setSelectedVariant(undefined);
    setQuantity(1);
    
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const calculatePrice = () => {
    let basePrice = 0;
    
    if (selectedVariant) {
      basePrice = parseFloat(selectedVariant.price.toString());
    } else {
      basePrice = parseFloat(dish.price || "0");
    }
    
    if (selectedSide) {
      basePrice += parseFloat(selectedSide.price as any || "0");
    }
    
    return basePrice.toFixed(2);
  };

  const priceWithSide = calculatePrice();

  // Helper pour obtenir l'image ID (supporte camelCase et snake_case)
  const getImageId = () => {
    const dishAny = dish as any;
    return dishAny.image_id || dish.imageId || null;
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 h-full flex flex-col bg-white/95 backdrop-blur-sm border border-orange-100/50 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:border-orange-200 animate-fadeIn relative group">
      {/* Accent décoratif sur le côté */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
      
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Overlay décoratif au survol */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
        
        <img
          src={getImageId() ? `/api/media/${getImageId()}` : "/images/placeholder-dish.jpg"}
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg z-20 animate-bounce hover:scale-110 transition-transform">
            ⭐ Vedette
          </Badge>
        )}
        {(((dish as any).preparation_time || dish.preparationTime) || dish.available !== undefined) && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-orange-200 flex items-center gap-2">
              {((dish as any).preparation_time || dish.preparationTime) && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">⏱️</span>
                  <span className="text-xs font-medium">{(dish as any).preparation_time || dish.preparationTime} min</span>
                </div>
              )}
              {dish.available ? (
                <span className="text-green-600 text-xs font-medium">✅</span>
              ) : (
                <span className="text-red-600 text-xs font-medium">❌</span>
              )}
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-6 flex-1 flex flex-col relative">
        {/* Motif décoratif subtil */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/20 rounded-full blur-2xl"></div>
        
        <h3 className="text-xl font-semibold mb-2 relative z-10 group-hover:text-orange-600 transition-colors duration-300">{dish.name}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-3 flex-1" title={dish.description || ""}>
          {dish.description}
        </p>
        
        {/* Affichage des ingrédients si disponibles */}
        {((dish as any).ingredients || dish.ingredients) && 
         (((dish as any).ingredients || dish.ingredients).trim() !== "") && (
          <div className="mb-2">
            <p className="text-xs text-muted-foreground font-medium mb-1">🍿 Ingrédients:</p>
            <p className="text-xs text-gray-600 line-clamp-2">
              {(dish as any).ingredients || dish.ingredients}
            </p>
          </div>
        )}
        
        {/* Affichage des allergènes si disponibles */}
        {((dish as any).allergens || dish.allergens) && 
         (((dish as any).allergens || dish.allergens).trim() !== "") && (
          <div className="mb-3">
            <p className="text-xs text-red-600 font-medium mb-1">⚠️ Allergènes:</p>
            <p className="text-xs text-red-500">
              {(dish as any).allergens || dish.allergens}
            </p>
          </div>
        )}
        
        {/* Badges alimentaires et allergènes */}
        <DietaryBadges 
          dietaryTags={(dish as any).dietaryTags || (dish as any).dietary_tags}
          allergenslist={(dish as any).allergensList || (dish as any).allergens_list}
          className="mb-3"
          size="sm"
        />
        
        {/* Ancienne section temps + disponibilité supprimée - maintenant dans le badge en haut à droite */}
        <div className="mt-auto">
          <div className="space-y-3">
            {/* Sélecteur de variante si le plat en a */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Option <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedVariant?.id.toString() || ""}
                  onValueChange={(variantId) => {
                    const variant = variants.find(v => v.id === parseInt(variantId));
                    setSelectedVariant(variant);
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choisir une option" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id.toString()}>
                        {showPricesInOptions ? (
                          <div className="flex items-center gap-2">
                            <span>{variant.label}</span>
                            <span className="text-xs text-muted-foreground">
                              ${parseFloat(variant.price.toString()).toFixed(2)} CAD
                            </span>
                          </div>
                        ) : (
                          <span>{variant.label}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Sélecteur d'accompagnement si le plat en a */}
            {sides.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Accompagnement <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedSide?.id.toString() || ""}
                  onValueChange={(sideId) => {
                    const side = sides.find(s => s.id === parseInt(sideId));
                    setSelectedSide(side);
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choisir un accompagnement" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {sides.map((side) => (
                      <SelectItem key={side.id} value={side.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{side.name}</span>
                          {parseFloat(side.price as any || "0") > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (+${parseFloat(side.price as any || "0").toFixed(2)} CAD)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Prix et bouton ajouter */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                {priceWithSide !== "0.00" ? (
                  <>
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      ${priceWithSide} CAD
                    </span>
                    {selectedVariant && (
                      <span className="text-xs text-muted-foreground">
                        {selectedVariant.label}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-lg font-medium text-muted-foreground">
                    Prix sur demande
                  </span>
                )}
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={
                  (variants.length > 0 && !selectedVariant) ||
                  (sides.length > 0 && !selectedSide)
                }
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}