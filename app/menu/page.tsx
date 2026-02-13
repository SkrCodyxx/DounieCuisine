"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/query-client";
import { getImageUrl } from "@/lib/image-utils";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import type { Dish, DishVariantNew, CateringCategory, CateringItem, CateringItemPrice } from "@/lib/schema";

interface DishWithVariants extends Dish {
  variants: DishVariantNew[];
}

interface CateringCategoryWithItems extends CateringCategory {
  items: (CateringItem & { prices: CateringItemPrice[] })[];
}

function DishCard({ dish }: { dish: DishWithVariants }) {
  const { addItem } = useCart();
  const imageUrl = getImageUrl(dish);
  const hasVariants = dish.hasVariants === 1 && dish.variants.length > 0;
  const displayPrice = hasVariants
    ? dish.variants.find((v) => v.isDefault === 1)?.price || dish.variants[0]?.price
    : dish.price;

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      {imageUrl && (
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{dish.name}</h3>
        {dish.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dish.description}</p>}

        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-primary">{formatPrice(displayPrice)} $ CAD</span>
          {dish.status === "out_of_stock" ? (
            <Badge variant="secondary">Rupture</Badge>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                const variant = hasVariants ? dish.variants.find((v) => v.isDefault === 1) || dish.variants[0] : undefined;
                addItem(dish, 1, undefined, variant);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>

        {hasVariants && (
          <div className="flex flex-wrap gap-1 mt-3">
            {dish.variants.map((v) => (
              <Badge key={v.id} variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => addItem(dish, 1, undefined, v)}>
                {v.label} - {formatPrice(v.price)} $
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "catering" ? "catering" : "takeout";
  const [tab, setTab] = useState(defaultTab);

  const { data: dishes = [], isLoading: dishesLoading } = useQuery<DishWithVariants[]>({
    queryKey: ["/api/dishes?isTakeout=1"],
    queryFn: () => apiRequest<DishWithVariants[]>("GET", "/api/dishes?isTakeout=1"),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: cateringMenu = [], isLoading: cateringLoading } = useQuery<CateringCategoryWithItems[]>({
    queryKey: ["/api/catering-menu"],
    queryFn: () => apiRequest<CateringCategoryWithItems[]>("GET", "/api/catering-menu"),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Group takeout dishes by category
  const categories = dishes.reduce<Record<string, DishWithVariants[]>>((acc, dish) => {
    const cat = dish.category || "Autres";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {});

  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-balance">Notre Menu</h1>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              {"Decouvrez nos plats haitiens authentiques"}
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="takeout">Pour Emporter</TabsTrigger>
              <TabsTrigger value="catering">Traiteur</TabsTrigger>
            </TabsList>

            <TabsContent value="takeout">
              {dishesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.entries(categories).map(([category, categoryDishes]) => (
                    <div key={category}>
                      <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b">{category}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categoryDishes.map((dish) => (
                          <DishCard key={dish.id} dish={dish} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="catering">
              {cateringLoading ? (
                <div className="space-y-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-xl" />
                  ))}
                </div>
              ) : cateringMenu.length === 0 ? (
                <div className="text-center py-20">
                  <UtensilsCrossed className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-muted-foreground">Menu traiteur bientot disponible</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {cateringMenu.map((category) => (
                    <div key={category.id}>
                      <h2 className="text-2xl font-serif font-bold mb-2">{category.nameFr}</h2>
                      {category.descriptionFr && (
                        <p className="text-muted-foreground mb-6">{category.descriptionFr}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.items.map((item) => (
                          <div key={item.id} className="p-4 rounded-lg border bg-card flex gap-4">
                            {item.imageId && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`/api/media/${item.imageId}`}
                                alt={item.nameFr}
                                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                loading="lazy"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{item.nameFr}</h3>
                              {item.descriptionFr && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.descriptionFr}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.prices.map((price) => (
                                  <Badge key={price.id} variant="secondary" className="text-xs">
                                    {price.sizeLabelFr}: {formatPrice(price.price)} $
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </PageLayout>
  );
}
