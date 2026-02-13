"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import FlexibleDishCard from "@/components/flexible-dish-card";
import { useSiteInfo, useMenuCategories, useTakeoutDishes } from "@/hooks/use-site-info";
import {
  ChefHat, Search, UtensilsCrossed, Filter, MapPin, Phone, X,
} from "lucide-react";
import type { Dish } from "@/types";

interface DishCategory {
  id: number;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: number;
}

export default function TakeoutPage() {
  const { data: dishes = [], isLoading, error } = useTakeoutDishes();
  const { data: siteInfo } = useSiteInfo();
  const { data: categories = [] } = useMenuCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const orderedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return (categories as DishCategory[])
      .filter((c) => c.isActive === 1)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((c) => c.name);
  }, [categories]);

  const filteredDishes = useMemo(() => {
    if (!dishes || !Array.isArray(dishes)) return [];
    return dishes.filter((dish: Dish) => {
      if (!dish) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !(dish.name ?? "").toLowerCase().includes(term) &&
          !(dish.description ?? "").toLowerCase().includes(term) &&
          !(dish.ingredients ?? "").toLowerCase().includes(term)
        )
          return false;
      }
      if (selectedCategory && dish.category !== selectedCategory) return false;
      if (onlyAvailable && !dish.available) return false;
      return true;
    });
  }, [dishes, searchTerm, selectedCategory, onlyAvailable]);

  const groupedDishes = useMemo(() => {
    if (!Array.isArray(filteredDishes)) return {};
    const grouped = filteredDishes.reduce<Record<string, Dish[]>>((acc, dish) => {
      if (!dish?.category) return acc;
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    }, {});
    Object.keys(grouped).forEach((k) =>
      grouped[k].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || (a.name ?? "").localeCompare(b.name ?? ""))
    );
    if (categories && Array.isArray(categories)) {
      const ordered: Record<string, Dish[]> = {};
      (categories as DishCategory[])
        .filter((c) => c.isActive === 1 && grouped[c.name])
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .forEach((c) => { ordered[c.name] = grouped[c.name]; });
      return ordered;
    }
    return grouped;
  }, [filteredDishes, categories]);

  const clearFilters = () => { setSearchTerm(""); setSelectedCategory(""); setOnlyAvailable(false); };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-serif text-2xl text-primary mb-4">Preparation du menu...</h2>
            <p className="text-muted-foreground">Nos chefs preparent vos plats favoris</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Card className="border-destructive/50 bg-destructive/10 max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <ChefHat className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-xl font-semibold mb-2">Erreur de Chargement</h3>
              <p className="text-muted-foreground mb-4">Impossible de charger le menu. Veuillez reessayer.</p>
              <Button onClick={() => window.location.reload()} variant="destructive">Reessayer</Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "p-4 space-y-6 pb-24" : ""}>
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Rechercher</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Nom du plat, ingredients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Categories</label>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              selectedCategory === "" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md" : "hover:bg-muted"
            }`}
          >
            Toutes
          </button>
          {orderedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md" : "hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="rounded border-border" />
        <span className="text-sm text-foreground">Plats disponibles uniquement</span>
      </label>
    </div>
  );

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-accent text-white py-6 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-7xl font-bold mb-4">Menu a Emporter</h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
            {"Savourez l'authenticite d'Haiti dans le confort de votre foyer"}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>Commandez au</span></div>
            <Separator orientation="vertical" className="h-6 bg-white/30 hidden sm:block" />
            <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{siteInfo?.phone1}</span></div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:gap-8">
            {/* Desktop Filters */}
            <div className="hidden lg:block lg:w-80">
              <Card className="sticky top-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Filtres
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-muted-foreground">Effacer tout</Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FilterSidebar />
                </CardContent>
              </Card>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="fixed bottom-20 right-4 lg:hidden z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-lg"
              aria-label="Filtres"
            >
              <Filter className="w-6 h-6" />
            </button>

            {/* Mobile Filter Panel */}
            {showFiltersPanel && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowFiltersPanel(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-muted border-b px-4 py-4 rounded-t-2xl flex items-center justify-between">
                    <h3 className="text-lg font-bold">Filtres</h3>
                    <button onClick={() => setShowFiltersPanel(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                  <FilterSidebar mobile />
                </div>
              </div>
            )}

            {/* Dishes Grid */}
            <div className="flex-1">
              {Object.entries(groupedDishes).map(([category, categoryDishes]) => (
                <div key={category} className="mb-12">
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-6 border-b pb-3">{category}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {categoryDishes.map((dish) => (
                      <FlexibleDishCard key={dish.id} dish={dish} />
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedDishes).length === 0 && (
                <div className="text-center py-20">
                  <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucun plat trouve</h3>
                  <p className="text-muted-foreground mb-4">Essayez de modifier vos filtres de recherche</p>
                  <Button onClick={clearFilters}>Effacer les filtres</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
