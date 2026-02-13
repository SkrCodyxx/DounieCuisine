import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSiteInfo, useMenuCategories, useTakeoutDishes } from "@/hooks/useSiteInfo";
import { 
  ChefHat, 
  ShoppingCart, 
  Search, 
  UtensilsCrossed, 
  Star, 
  Clock, 
  Filter,
  MapPin,
  Phone,
  X
} from "lucide-react";
import type { Dish, DishVariant } from "@shared/schema";
import { useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/lib/image-utils";
import { apiRequest } from "@/lib/queryClient";
import VariantSelector from "@/components/VariantSelector";
import FlexibleDishCard from "@/components/FlexibleDishCard";

// Interface pour les catégories avec les champs de l'API
interface DishCategory {
  id: number;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Type étendu pour inclure les variantes
interface DishWithVariants extends Dish {
  variants?: DishVariant[];
}

interface TakeoutMenuProps {
  embedded?: boolean;
}

export default function TakeoutMenu({ embedded = false }: TakeoutMenuProps) {
  // Utilisation des hooks centralisés avec cache optimisé
  const { data: dishes = [], isLoading, error } = useTakeoutDishes();
  const { data: siteInfo } = useSiteInfo();
  const { data: categories = [] } = useMenuCategories();

  const { addItem } = useCart();
    
  // États des filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Debug simplifié
  if (isLoading) {
    console.log("🔄 Chargement des plats takeout...");
  }
  
  if (error) {
    console.error("❌ Erreur chargement takeout:", error);
  }

  // Extraire les catégories dans l'ordre défini par l'admin
  const orderedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return categories
      .filter(cat => cat.is_active === 1)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(cat => cat.name);
  }, [categories]);

  // Filtrer les plats avec gestion d'erreur robuste
  const filteredDishes = useMemo(() => {
    if (!dishes || !Array.isArray(dishes)) return [];
    
    try {
      return dishes.filter(dish => {
        if (!dish) return false;
        
        // Filtre de recherche
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const name = (dish.name || "").toLowerCase();
          const description = (dish.description || "").toLowerCase();
          const ingredients = (dish.ingredients || "").toLowerCase();
          
          if (!name.includes(term) && !description.includes(term) && !ingredients.includes(term)) {
            return false;
          }
        }
        
        // Filtre de catégorie
        if (selectedCategory && dish.category !== selectedCategory) {
          return false;
        }
        
        // Filtre disponibilité
        if (onlyAvailable && !dish.available) {
          return false;
        }
        
        return true;
      });
    } catch (err) {
      console.error("Erreur filtrage plats:", err);
      return [];
    }
  }, [dishes, searchTerm, selectedCategory, onlyAvailable]);

  // Grouper par catégorie avec gestion d'erreur
  const groupedDishes = useMemo(() => {
    if (!Array.isArray(filteredDishes)) return {};
    
    try {
      // Grouper tous les plats par catégorie
      const grouped = filteredDishes.reduce((acc, dish) => {
        if (!dish?.category) return acc;
        
        if (!acc[dish.category]) {
          acc[dish.category] = [];
        }
        acc[dish.category].push(dish);
        return acc;
      }, {} as Record<string, DishWithVariants[]>);

      // Trier les plats dans chaque catégorie
      Object.keys(grouped).forEach(category => {
        grouped[category].sort((a: DishWithVariants, b: DishWithVariants) => {
          const orderA = a.displayOrder || 999;
          const orderB = b.displayOrder || 999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.name || "").localeCompare(b.name || "");
        });
      });

      // Retourner un objet ordonné selon displayOrder des catégories
      const orderedGrouped: Record<string, DishWithVariants[]> = {};
      
      // Si nous avons des catégories, utiliser leur ordre
      if (categories && Array.isArray(categories)) {
        categories
          .filter(cat => cat.is_active === 1 && grouped[cat.name])
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .forEach(category => {
            orderedGrouped[category.name] = grouped[category.name];
          });
      } else {
        // Sinon, retourner le groupage basique
        return grouped;
      }
      
      return orderedGrouped;
    } catch (err) {
      console.error("Erreur groupement plats:", err);
      return {};
    }
  }, [filteredDishes, categories]);

  const handleAddToCart = (dish: DishWithVariants, selectedVariant?: DishVariant, quantity: number = 1) => {
    addItem(dish, quantity, undefined, selectedVariant);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setOnlyAvailable(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
      <TopInfoBar />
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-serif text-2xl text-primary mb-4">Préparation du menu...</h2>
            <p className="text-muted-foreground">Nos chefs préparent vos plats favoris</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <TopInfoBar />
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-[7.5rem] md:pt-[8.75rem] lg:pt-36">
          <Card className="border-red-200 bg-red-50 max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <ChefHat className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2 text-red-800">Erreur de Chargement</h3>
              <p className="text-red-600 mb-4">Impossible de charger le menu. Veuillez réessayer.</p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${embedded ? '' : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/30 relative'}`}>
      {!embedded && (
        <>
          {/* Motifs décoratifs en arrière-plan */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Motifs géométriques subtils */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </>
      )}
      
      <div className={embedded ? '' : 'relative z-10'}>
        {!embedded && (
          <>
            <TopInfoBar />
            <Navigation />
          </>
        )}

        {!embedded && (
          /* Hero Section - connexion parfaite TopInfoBar > Navigation > Hero */
          <section className="relative bg-gradient-to-r from-primary via-primary/90 to-accent text-white py-6 md:py-20 pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-20 md:w-32 h-20 md:h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-24 md:w-40 h-24 md:h-40 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-orange-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Effet de vague décorative */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-2 md:mb-6">
              <div className="w-12 md:w-20 h-12 md:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative overflow-hidden group hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <UtensilsCrossed className="w-6 md:w-10 h-6 md:h-10 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            
            <h1 className="font-serif text-2xl md:text-5xl lg:text-7xl font-bold mb-2 md:mb-6">
              Menu à Emporter
            </h1>
            
            <p className="text-xs md:text-xl lg:text-2xl text-white/90 mb-3 md:mb-8 leading-relaxed">
              Savourez l'authenticité d'Haïti dans le confort de votre foyer
            </p>

            {/* Informations de contact */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-6 text-xs md:text-lg">
              <div className="flex items-center gap-1 md:gap-2">
                <MapPin className="w-3 md:w-5 h-3 md:h-5" />
                <span>Commandez au</span>
              </div>
              <Separator orientation="vertical" className="h-4 md:h-6 bg-white/30 hidden sm:block" />
              <div className="flex items-center gap-1 md:gap-2">
                <Phone className="w-3 md:w-5 h-3 md:h-5" />
                <span className="truncate text-xs md:text-base">{siteInfo?.phone1}</span>
              </div>
              {siteInfo?.phone2 && (
                <>
                  <span className="text-white/60 hidden md:inline">•</span>
                  <span className="truncate text-xs md:text-base">{siteInfo.phone2}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
        )}

      {/* Contenu principal */}
      <div className={`flex-1 ${embedded ? 'py-8 md:py-12 bg-gradient-to-b from-white via-orange-50/30 to-white' : 'py-12'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:gap-8">
            {/* Sidebar des filtres - Desktop */}
            <div className="hidden lg:block lg:w-80 mb-8 lg:mb-0">
              <Card className="bg-white/98 backdrop-blur-xl border-2 border-orange-200/60 shadow-2xl sticky top-8 hover:shadow-3xl hover:border-orange-300/80 transition-all duration-300 animate-fadeIn relative overflow-hidden group rounded-2xl">
                {/* Accent décoratif */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500"></div>
                {/* Motif décoratif */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/30 rounded-full blur-2xl"></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Filtres
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-muted-foreground"
                  >
                    Effacer tout
                  </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Barre de recherche */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Rechercher
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Nom du plat, ingrédients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Catégories */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Catégories
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory("")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 ${
                          selectedCategory === ""
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                            : "hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50"
                        }`}
                      >
                        Toutes
                      </button>
                      {orderedCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 relative overflow-hidden group ${
                            selectedCategory === category
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                              : "hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50"
                          }`}
                        >
                          {selectedCategory === category && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                          )}
                          <span className="relative z-10">{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section niveau d'épices supprimée */}

                  <Separator />

                  {/* Disponibilité */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyAvailable}
                        onChange={(e) => setOnlyAvailable(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Plats disponibles uniquement</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bouton de filtres mobile - Floating */}
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="fixed bottom-20 right-4 sm:right-6 lg:hidden z-40 bg-primary text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
              title="Afficher/Masquer les filtres"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
              <Filter className="w-6 h-6" />
            </button>

            {/* Panneau des filtres mobile */}
            {showFiltersPanel && (
              <div className="fixed inset-0 z-50 lg:hidden">
                {/* Overlay */}
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowFiltersPanel(false)}
                />
                {/* Panneau */}
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slideIn">
                  <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 px-4 py-4 rounded-t-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Filtres</h3>
                      <button
                        onClick={() => setShowFiltersPanel(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-6 pb-24">
                    {/* Barre de recherche */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Rechercher
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Nom du plat, ingrédients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Catégories */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Catégories
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedCategory("")}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedCategory === ""
                              ? "bg-primary text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Toutes
                        </button>
                        {orderedCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedCategory === category
                                ? "bg-primary text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section niveau d'épices supprimée */}

                    <Separator />

                    {/* Disponibilité */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlyAvailable}
                          onChange={(e) => setOnlyAvailable(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Plats disponibles uniquement</span>
                      </label>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        clearFilters();
                        setShowFiltersPanel(false);
                      }}
                      className="w-full mt-6"
                    >
                      Effacer tous les filtres
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des plats */}
            <div className="flex-1">
              {Object.keys(groupedDishes).length === 0 ? (
                <Card className="bg-white/98 backdrop-blur-xl border-2 border-orange-200/60 shadow-2xl relative overflow-hidden animate-fadeIn rounded-2xl">
                  {/* Motifs décoratifs */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/30 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl"></div>
                  <CardContent className="py-20 text-center relative z-10">
                    <ChefHat className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-4">Aucun plat trouvé</h3>
                    <p className="text-muted-foreground mb-6">
                      Essayez de modifier vos filtres pour découvrir nos délicieuses spécialités.
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      Effacer les filtres
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-16">
                  {Object.entries(groupedDishes).map(([category, categoryDishes]) => (
                    <div key={category} className="space-y-8">
                      {/* Titre de catégorie amélioré */}
                      <div className="text-center relative animate-fadeIn">
                        {/* Motif décoratif derrière le titre */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <div className="w-40 h-40 bg-gradient-to-r from-orange-300 to-amber-300 rounded-full blur-3xl"></div>
                        </div>
                        <div className="relative z-10 py-6">
                          <h2 className="font-serif text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-4">
                            {category}
                          </h2>
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-orange-400 rounded-full"></div>
                            <div className="w-3 h-3 rotate-45 border-2 border-orange-400"></div>
                            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent via-orange-400 to-orange-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Grille des plats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {(categoryDishes as DishWithVariants[]).map((dish: DishWithVariants) => (
                          <FlexibleDishCard key={dish.id} dish={dish} featured={dish.featured === 1} showPricesInOptions={false} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {!embedded && <Footer />}
      </div>
    </div>
  );
}
