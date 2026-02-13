import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface DishCardProps {
  name: string;
  description: string;
  price: number;
  image: string;
  spiceLevel?: "doux" | "moyen" | "epicé" | "très_epicé";
  featured?: boolean;
  onAddToCart?: () => void;
}

export default function DishCard({
  name,
  description,
  price,
  image,
  spiceLevel,
  featured,
  onAddToCart,
}: DishCardProps) {
  const spiceLevelMap = {
    doux: 1,
    moyen: 2,
    epicé: 3,
    très_epicé: 4,
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300 h-full flex flex-col">
      <div className="relative aspect-[16/9] md:aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-primary text-primary-foreground text-xs">
            Vedette
          </Badge>
        )}
        {spiceLevel && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-0.5 md:gap-1">
            {Array.from({ length: spiceLevelMap[spiceLevel] }).map((_, i) => (
              <Flame key={i} className="w-3 h-3 md:w-4 md:h-4 text-red-500 fill-red-500" />
            ))}
          </div>
        )}
      </div>
      <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-semibold mb-2" data-testid={`text-dish-name-${name.toLowerCase().replace(/\s+/g, "-")}`}>
          {name}
        </h3>
        <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-3 flex-1" title={description}>
          {description}
        </p>
        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-lg md:text-2xl font-bold text-primary" data-testid={`text-price-${price}`}>
            ${price.toFixed(2)}
          </span>
          <Button
            onClick={onAddToCart}
            size="sm"
            className="text-xs md:text-sm px-3 md:px-4"
            data-testid={`button-add-to-cart-${name.toLowerCase().replace(/\s+/g, "-")}`}
          >
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
