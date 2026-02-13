import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMenuCategories, useAdminTakeoutDishes } from "@/hooks/useSiteInfo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { refreshAdminAndPublicCache, invalidateDishVariants } from "@/lib/cacheUtils";
import { getImageUrl } from "@/lib/image-utils";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Tags,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Save,
  X,
  Check,
  Clock,
  Star,
  Search,
  Filter,
  MoreVertical,
  GripVertical,
  ChefHat,
  Settings,
  ImageIcon,
} from "lucide-react";
import SingleUpload from "@/components/upload/SingleUpload";
import SidesManager from "@/components/admin/SidesManager";
import FlexibleVariantsManager from "@/components/admin/FlexibleVariantsManager";
import type { Dish, DishVariant } from "@shared/schema";

// Types
interface TakeoutDish extends Dish {
  variants?: DishVariant[];
}

interface DishCategory {
  id?: number;
  name: string;
  description?: string | null;
  display_order?: number;
  is_active?: number;
}

interface DeleteAlert {
  type: "dish" | "category";
  id: number;
  name: string;
}

const SPICE_LEVELS = [
  { value: "doux", label: "🌶️ Doux", color: "bg-green-100 text-green-800" },
  { value: "moyen", label: "🌶️🌶️ Moyen", color: "bg-yellow-100 text-yellow-800" },
  { value: "épicé", label: "🌶️🌶️🌶️ Épicé", color: "bg-orange-100 text-orange-800" },
  { value: "très épicé", label: "🌶️🌶️🌶️🌶️ Très épicé", color: "bg-red-100 text-red-800" }
];

export default function MenuTakeoutAdmin() {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState<"dishes" | "categories" | "sides" | "variants">("dishes");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showDishDialog, setShowDishDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<DeleteAlert | null>(null);
  
  // Form states
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    ingredients: "",
    allergens: "",
    dietaryTags: [] as string[],
    allergensList: [] as string[],
    spiceLevel: "moyen",
    preparationTime: 30,
    available: true,
    featured: false,
    imageId: null as number | null,
    hasVariants: true, // Par défaut, utiliser le système de variantes flexibles
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Queries
  const { data: authUser, isLoading: isLoadingAuth } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => apiRequest("GET", "/api/admin/auth/me"),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - session admin
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Using admin hooks for admin interface
  const { data: takeoutDishes = [], isLoading: isLoadingDishes } = useAdminTakeoutDishes() as { data: TakeoutDish[]; isLoading: boolean };
  
  const { data: categories = [], isLoading: isLoadingCategories } = useMenuCategories() as { data: DishCategory[]; isLoading: boolean };

  // Mutations - Dishes
  const createDishMutation = useMutation({
    mutationFn: (data: any) => {
      // Normaliser les champs de prix
      const normalizePrice = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      return apiRequest("POST", "/api/admin/dishes", {
        ...data,
        price: normalizePrice(data.price),
        preparationTime: data.preparationTime === '' || data.preparationTime === undefined ? null : Number(data.preparationTime),
        isTakeout: 1,
        available: data.available ? 1 : 0,
        featured: data.featured ? 1 : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["takeout-dishes"] });
      refreshAdminAndPublicCache("/api/admin/dishes");
      setShowDishDialog(false);
      resetDishForm();
      toast({ title: "✅ Plat créé", description: "Le plat a été ajouté avec succès" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || "Impossible de créer le plat", 
        variant: "destructive" 
      });
    },
  });

  const updateDishMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      // Normaliser les champs de prix - convertir les chaînes vides en null
      const normalizePrice = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      return apiRequest("PATCH", `/api/admin/dishes/${id}`, {
        ...data,
        price: normalizePrice(data.price),
        preparationTime: data.preparationTime === '' || data.preparationTime === undefined ? null : Number(data.preparationTime),
        available: data.available ? 1 : 0,
        featured: data.featured ? 1 : 0,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["takeout-dishes"] });
      refreshAdminAndPublicCache("/api/admin/dishes");
      
      // Invalider les variantes du plat modifié si nécessaire
      if (editingDishId) {
        await invalidateDishVariants(editingDishId);
      }
      
      setShowDishDialog(false);
      setEditingDishId(null);
      resetDishForm();
      toast({ title: "✅ Plat modifié", description: "Les modifications ont été enregistrées" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || "Impossible de modifier le plat", 
        variant: "destructive" 
      });
    },
  });

  const deleteDishMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/dishes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["takeout-dishes"] });
      refreshAdminAndPublicCache("/api/admin/dishes");
      setDeleteAlert(null);
      toast({ title: "✅ Plat supprimé", description: "Le plat a été retiré du menu" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || "Impossible de supprimer le plat", 
        variant: "destructive" 
      });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: number; available: number }) => 
      apiRequest("PATCH", `/api/admin/dishes/${id}`, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["takeout-dishes"] });
      refreshAdminAndPublicCache("/api/admin/dishes");
    },
  });

  // Mutations - Categories
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/dish-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dish-categories"] });
      setShowCategoryDialog(false);
      resetCategoryForm();
      toast({ title: "✅ Catégorie créée", description: "La catégorie a été ajoutée" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || "Impossible de créer la catégorie", 
        variant: "destructive" 
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/admin/dish-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dish-categories"] });
      setShowCategoryDialog(false);
      setEditingCategoryId(null);
      resetCategoryForm();
      toast({ title: "✅ Catégorie modifiée", description: "Les modifications ont été enregistrées" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || "Impossible de modifier la catégorie", 
        variant: "destructive" 
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/dish-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dish-categories"] });
      setDeleteAlert(null);
      toast({ title: "✅ Catégorie supprimée", description: "La catégorie a été retirée" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur", 
        description: error.message || "Impossible de supprimer la catégorie (peut-être utilisée par des plats)", 
        variant: "destructive" 
      });
    },
  });

  const moveCategoryMutation = useMutation({
    mutationFn: ({ id, display_order }: { id: number; display_order: number }) => 
      apiRequest("PATCH", `/api/admin/dish-categories/${id}`, { display_order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dish-categories"] });
    },
  });

  // Form handlers
  const resetDishForm = () => {
    setDishForm({
      name: "",
      description: "",
      category: "",
      price: "",
      ingredients: "",
      allergens: "",
      dietaryTags: [],
      allergensList: [],
      spiceLevel: "moyen",
      preparationTime: 30,
      available: true,
      featured: false,
      imageId: null,
      hasVariants: true, // Par défaut, utiliser le système de variantes flexibles
    });
    setEditingDishId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
    });
    setEditingCategoryId(null);
  };

  const openDishDialog = (dish?: TakeoutDish) => {
    if (dish) {
      setEditingDishId(dish.id);
      const parseTags = (tags: any) => {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags;
        try { return JSON.parse(tags); } catch { return []; }
      };
      setDishForm({
        name: dish.name,
        description: dish.description || "",
        category: dish.category,
        price: dish.price?.toString() || "",
        ingredients: dish.ingredients || "",
        allergens: dish.allergens || "",
        dietaryTags: parseTags((dish as any).dietaryTags || (dish as any).dietary_tags),
        allergensList: parseTags((dish as any).allergensList || (dish as any).allergens_list),
        spiceLevel: dish.spiceLevel || "moyen",
        preparationTime: dish.preparationTime || 30,
        available: !!dish.available,
        featured: !!dish.featured,
        imageId: dish.imageId || null,
        hasVariants: !!dish.hasVariants, // Maintenir la configuration des variantes
      });
    } else {
      resetDishForm();
    }
    setShowDishDialog(true);
  };

  const openCategoryDialog = (category?: DishCategory) => {
    if (category && category.id) {
      setEditingCategoryId(category.id);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
      });
    } else {
      resetCategoryForm();
    }
    setShowCategoryDialog(true);
  };

  const handleSaveDish = () => {
    // Validation
    if (!dishForm.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du plat est requis", variant: "destructive" });
      return;
    }
    if (!dishForm.category) {
      toast({ title: "Erreur", description: "La catégorie est requise", variant: "destructive" });
      return;
    }
    
    // Le prix de base n'est pas obligatoire car les variantes peuvent avoir leurs propres prix

    // Convertir les tableaux en JSON pour le stockage en base de données
    const data = { 
      ...dishForm,
      dietaryTags: JSON.stringify(dishForm.dietaryTags),
      allergensList: JSON.stringify(dishForm.allergensList)
    };
    
    if (editingDishId) {
      updateDishMutation.mutate({ id: editingDishId, data });
    } else {
      createDishMutation.mutate(data);
    }
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Erreur", description: "Le nom de la catégorie est requis", variant: "destructive" });
      return;
    }

    const data = { 
      ...categoryForm,
      display_order: editingCategoryId 
        ? categories.find(c => c.id === editingCategoryId)?.display_order || 1
        : Math.max(...categories.map(c => c.display_order || 0), 0) + 1
    };
    
    if (editingCategoryId) {
      updateCategoryMutation.mutate({ id: editingCategoryId, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteAlert) return;
    
    if (deleteAlert.type === "dish") {
      deleteDishMutation.mutate(deleteAlert.id);
    } else if (deleteAlert.type === "category" && deleteAlert.id) {
      deleteCategoryMutation.mutate(deleteAlert.id);
    }
  };

  const moveCategory = (categoryId: number, direction: "up" | "down") => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    const targetIndex = direction === "up" ? categoryIndex - 1 : categoryIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCategory = categories[categoryIndex];
    const targetCategory = categories[targetIndex];

    if (!currentCategory.id || !targetCategory.id) return;

    const currentOrder = currentCategory.display_order || 0;
    const targetOrder = targetCategory.display_order || 0;

    moveCategoryMutation.mutate({ id: currentCategory.id, display_order: targetOrder });
    moveCategoryMutation.mutate({ id: targetCategory.id, display_order: currentOrder });
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return takeoutDishes
      .filter(dish => {
        const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             dish.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || dish.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Tri alphabétique des plats
  }, [takeoutDishes, searchQuery, categoryFilter]);

  // Group dishes by category with proper ordering
  const dishesByCategory = useMemo(() => {
    const grouped: Record<string, TakeoutDish[]> = {};
    filteredDishes.forEach(dish => {
      if (!grouped[dish.category]) {
        grouped[dish.category] = [];
      }
      grouped[dish.category].push(dish);
    });
    
    // Trier les plats dans chaque catégorie par ordre alphabétique
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [filteredDishes]);

  // Ordered categories based on displayOrder from categories table
  const orderedCategoriesWithDishes = useMemo(() => {
    // Trier les catégories par displayOrder
    const sortedCategories = categories
      .filter(cat => cat.is_active && dishesByCategory[cat.name])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    return sortedCategories.map(category => ({
      name: category.name,
      dishes: dishesByCategory[category.name] || [],
      displayOrder: category.display_order || 0
    }));
  }, [categories, dishesByCategory]);

  // Statistics
  const stats = useMemo(() => ({
    total: takeoutDishes.length,
    available: takeoutDishes.filter(d => d.available).length,
    unavailable: takeoutDishes.filter(d => !d.available).length,
    featured: takeoutDishes.filter(d => d.featured).length,
    categories: categories.length,
  }), [takeoutDishes, categories]);

  if (isLoadingAuth || isLoadingDishes || isLoadingCategories) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du menu...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              Menu À Emporter
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos plats et catégories pour la vente à emporter
            </p>
          </div>
          <Button onClick={() => openDishDialog()} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau Plat
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plats</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Indisponibles</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unavailable}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vedettes</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dishes" | "categories" | "sides" | "variants")}>
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="dishes" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Plats ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Catégories ({stats.categories})
            </TabsTrigger>
            <TabsTrigger value="sides" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Accompagnements
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Variantes Flexibles
            </TabsTrigger>
          </TabsList>

          {/* Dishes Tab */}
          <TabsContent value="dishes" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un plat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories
                        .filter(c => c.is_active)
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dishes List */}
            {filteredDishes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun plat trouvé</p>
                  <Button onClick={() => openDishDialog()} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter votre premier plat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orderedCategoriesWithDishes.map(({ name: category, dishes }) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5 text-primary" />
                        {category}
                        <Badge variant="secondary" className="ml-2">{dishes.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {dishes.map(dish => (
                          <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative">
                              {dish.imageId ? (
                                <img 
                                  src={getImageUrl(dish)!} 
                                  alt={dish.name}
                                  className="w-full h-40 object-cover"
                                />
                              ) : (
                                <div className="w-full h-40 bg-muted flex items-center justify-center">
                                  <ChefHat className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              {dish.featured && (
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                    <Star className="h-3 w-3 mr-1" />
                                    Vedette
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-semibold line-clamp-1">{dish.name}</h3>
                                  <Switch
                                    checked={!!dish.available}
                                    onCheckedChange={(checked) => 
                                      toggleAvailabilityMutation.mutate({ 
                                        id: dish.id, 
                                        available: checked ? 1 : 0 
                                      })
                                    }
                                  />
                                </div>
                                {dish.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {dish.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between pt-2">
                                  <div className="space-y-1">
                                    {dish.hasVariants ? (
                                      <div className="text-xs text-muted-foreground">Variantes disponibles</div>
                                    ) : (
                                      <div className="text-lg font-bold text-primary">{dish.price}$</div>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => openDishDialog(dish)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setDeleteAlert({ type: "dish", id: dish.id, name: dish.name })}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Badge 
                                    variant="secondary" 
                                    className={SPICE_LEVELS.find(s => s.value === dish.spiceLevel)?.color}
                                  >
                                    {SPICE_LEVELS.find(s => s.value === dish.spiceLevel)?.label}
                                  </Badge>
                                  {dish.preparationTime && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {dish.preparationTime} min
                                    </Badge>
                                  )}
                                  {!dish.available && (
                                    <Badge variant="destructive">Indisponible</Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des Catégories</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Organisez les catégories de votre menu
                    </p>
                  </div>
                  <Button onClick={() => openCategoryDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Catégorie
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune catégorie</p>
                    <Button onClick={() => openCategoryDialog()} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer votre première catégorie
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories
                      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                      .map((category, index) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => category.id && moveCategory(category.id, "up")}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={index === categories.length - 1}
                            onClick={() => category.id && moveCategory(category.id, "down")}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{category.name}</h3>
                            <Badge variant="secondary">
                              {takeoutDishes.filter(d => d.category === category.name).length} plats
                            </Badge>
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCategoryDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => category.id && setDeleteAlert({ 
                              type: "category", 
                              id: category.id, 
                              name: category.name 
                            })}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sides Tab */}
          <TabsContent value="sides" className="space-y-4">
            <SidesManager dishId={null} />
          </TabsContent>

          {/* Flexible Variants Tab */}
          <TabsContent value="variants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Variantes Flexibles</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un plat pour gérer ses variantes personnalisées (tailles, options, etc.)
                </p>
              </CardHeader>
              <CardContent>
                {takeoutDishes.length === 0 ? (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun plat disponible</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Créez des plats dans l'onglet "Plats" pour gérer leurs variantes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label>Sélectionner un plat:</Label>
                      <Select
                        value={editingDishId?.toString() || ""}
                        onValueChange={(value) => setEditingDishId(parseInt(value) || null)}
                      >
                        <SelectTrigger className="w-[300px]">
                          <SelectValue placeholder="Choisir un plat à configurer" />
                        </SelectTrigger>
                        <SelectContent>
                          {takeoutDishes.map((dish) => (
                            <SelectItem key={dish.id} value={dish.id.toString()}>
                              {dish.name} - {dish.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editingDishId && (
                      <FlexibleVariantsManager 
                        dishId={editingDishId} 
                        dishName={takeoutDishes.find(d => d.id === editingDishId)?.name || ""}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dish Dialog */}
        <Dialog open={showDishDialog} onOpenChange={setShowDishDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDishId ? "Modifier le plat" : "Nouveau plat"}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du plat pour le menu à emporter
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="dish-name">Nom du plat *</Label>
                <Input
                  id="dish-name"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  placeholder="Ex: Pad Thaï aux crevettes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-description">Description</Label>
                <Textarea
                  id="dish-description"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Décrivez le plat..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dish-category">Catégorie *</Label>
                  <Select
                    value={dishForm.category}
                    onValueChange={(value) => setDishForm({ ...dishForm, category: value })}
                  >
                    <SelectTrigger id="dish-category">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.is_active).map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dish-spice">Niveau de piquant</Label>
                  <Select
                    value={dishForm.spiceLevel}
                    onValueChange={(value) => setDishForm({ ...dishForm, spiceLevel: value })}
                  >
                    <SelectTrigger id="dish-spice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPICE_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="dish-price">Prix de base</Label>
                  <Input
                    id="dish-price"
                    type="number"
                    step="0.01"
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    placeholder="15.99"
                  />
                  <p className="text-sm text-muted-foreground">
                    Prix de base du plat. Les variantes peuvent avoir des prix différents via l'onglet Variantes Flexibles.
                  </p>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Photo du plat</Label>
                <SingleUpload
                  value={dishForm.imageId}
                  onChange={(mediaId: number | null) => setDishForm({ ...dishForm, imageId: mediaId })}
                />
                {dishForm.imageId && (
                  <div className="mt-2">
                    <img 
                      src={`/api/media/${dishForm.imageId}`}
                      alt="Aperçu"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                <Label htmlFor="dish-ingredients">Ingrédients</Label>
                <Textarea
                  id="dish-ingredients"
                  value={dishForm.ingredients}
                  onChange={(e) => setDishForm({ ...dishForm, ingredients: e.target.value })}
                  placeholder="Liste des ingrédients principaux..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-allergens">Allergènes (ancien champ)</Label>
                <Input
                  id="dish-allergens"
                  value={dishForm.allergens}
                  onChange={(e) => setDishForm({ ...dishForm, allergens: e.target.value })}
                  placeholder="Ex: Arachides, Fruits de mer, Gluten"
                />
              </div>

              {/* Tags alimentaires */}
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Tags Alimentaires
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["vegetarian", "vegan", "gluten-free", "dairy-free", "halal", "kosher", "nut-free", "spicy"].map(tag => (
                    <Badge
                      key={tag}
                      variant={dishForm.dietaryTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newTags = dishForm.dietaryTags.includes(tag)
                          ? dishForm.dietaryTags.filter(t => t !== tag)
                          : [...dishForm.dietaryTags, tag];
                        setDishForm({ ...dishForm, dietaryTags: newTags });
                      }}
                    >
                      {tag === "vegetarian" && "🌱 Végétarien"}
                      {tag === "vegan" && "🥬 Végétalien"}
                      {tag === "gluten-free" && "🌾 Sans gluten"}
                      {tag === "dairy-free" && "🥛 Sans lactose"}
                      {tag === "halal" && "🏅 Halal"}
                      {tag === "kosher" && "✡️ Casher"}
                      {tag === "nut-free" && "🥜 Sans noix"}
                      {tag === "spicy" && "🌶️ Épicé"}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Liste d'allergènes détaillée */}
              <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Label className="text-base font-semibold flex items-center gap-2">
                  ⚠️ Allergènes Présents
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["gluten", "lactose", "nuts", "shellfish", "eggs", "soy"].map(allergen => (
                    <Badge
                      key={allergen}
                      variant={dishForm.allergensList.includes(allergen) ? "destructive" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newAllergens = dishForm.allergensList.includes(allergen)
                          ? dishForm.allergensList.filter(a => a !== allergen)
                          : [...dishForm.allergensList, allergen];
                        setDishForm({ ...dishForm, allergensList: newAllergens });
                      }}
                    >
                      {allergen === "gluten" && "🌾 Gluten"}
                      {allergen === "lactose" && "🥛 Lactose"}
                      {allergen === "nuts" && "🥜 Noix"}
                      {allergen === "shellfish" && "🦐 Fruits de mer"}
                      {allergen === "eggs" && "🥚 Œufs"}
                      {allergen === "soy" && "🫘 Soya"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prep-time">Temps de préparation (min)</Label>
                <Input
                  id="prep-time"
                  type="number"
                  value={dishForm.preparationTime}
                  onChange={(e) => setDishForm({ ...dishForm, preparationTime: Number(e.target.value) })}
                />
              </div>

              {/* Sides & Variants Management */}
              {editingDishId && (
                <div className="border-t pt-4 mt-4 space-y-6">
                  <SidesManager dishId={editingDishId} />
                  <FlexibleVariantsManager 
                    dishId={editingDishId} 
                    dishName={dishForm.name}
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Disponible</Label>
                  <Switch
                    checked={dishForm.available}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, available: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Plat vedette</Label>
                  <Switch
                    checked={dishForm.featured}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, featured: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDishDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveDish}>
                <Save className="h-4 w-4 mr-2" />
                {editingDishId ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategoryId ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </DialogTitle>
              <DialogDescription>
                Créez une catégorie pour organiser votre menu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nom de la catégorie *</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ex: Entrées"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveCategory}>
                <Save className="h-4 w-4 mr-2" />
                {editingCategoryId ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteAlert} onOpenChange={() => setDeleteAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer "{deleteAlert?.name}" ?
                {deleteAlert?.type === "category" && (
                  <span className="block mt-2 text-red-600 font-semibold">
                    Les plats de cette catégorie devront être réassignés.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
