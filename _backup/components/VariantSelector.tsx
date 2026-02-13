import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DishVariant } from "@shared/schema";

interface Side {
  id: number;
  name: string;
  description?: string;
  price: number;
}

interface VariantSelectorProps {
  variants: DishVariant[];
  onAddToCart: (selectedSize: 'small' | 'large', quantity: number) => void;
  disabled?: boolean;
  className?: string;
  sides?: Side[];
  selectedSide?: Side;
  onSideChange?: (side: Side | undefined) => void;
}

export default function VariantSelector({ 
  variants, 
  onAddToCart, 
  disabled = false,
  className = "",
  sides = [],
  selectedSide,
  onSideChange,
}: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<'small' | 'large'>('small');
  const [quantity, setQuantity] = useState(1);

  // Trouver la variante sélectionnée
  const smallVariant = variants.find(v => v.label?.toLowerCase().includes('petit'));
  const largeVariant = variants.find(v => v.label?.toLowerCase().includes('grand'));
  const selectedVariant = selectedSize === 'small' ? smallVariant : largeVariant;

  if (!selectedVariant) return null;

  const handleAddToCart = () => {
    // Vérifier qu'un accompagnement est sélectionné si disponible
    if (sides && sides.length > 0 && !selectedSide) {
      return; // Button doit être disabled
    }
    onAddToCart(selectedSize, quantity);
    setQuantity(1); // Reset quantity après ajout
  };

  const calculateTotalPrice = () => {
  let price = parseFloat(String(selectedVariant.price)) * quantity;
    if (selectedSide) {
      price += parseFloat(selectedSide.price as any || "0") * quantity;
    }
    return price.toFixed(2);
  };

  return (
    <div className={`${className}`}>
      <div className="space-y-3">
        {/* Sélection d'option */}
        <div>
          <h4 className="font-medium mb-2 text-xs text-muted-foreground">Option :</h4>
          <div className="flex gap-1">
            {smallVariant && (
              <Button
                variant={selectedSize === 'small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSize('small')}
                className="flex-1 h-8 text-xs px-2"
              >
                {smallVariant.label}
              </Button>
            )}
            {largeVariant && (
              <Button
                variant={selectedSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSize('large')}
                className="flex-1 h-8 text-xs px-2"
              >
                {largeVariant.label}
              </Button>
            )}
          </div>
        </div>

        {/* Sélection d'accompagnement si disponible */}
        {sides && sides.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Accompagnement <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedSide?.id.toString() || ""}
              onValueChange={(sideId) => {
                const side = sides.find(s => s.id === parseInt(sideId));
                if (onSideChange) {
                  onSideChange(side);
                }
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

        {/* Quantité et ajout panier combinés */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[2rem] text-center">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={disabled || (sides && sides.length > 0 && !selectedSide)}
            size="sm"
            className="flex-1 h-8 text-xs"
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            ${calculateTotalPrice()}
          </Button>
        </div>
      </div>
    </div>
  );
}