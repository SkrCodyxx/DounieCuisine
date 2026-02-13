import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X, Settings, DollarSign, ChevronDown, ChevronUp, Package, ShoppingCart, Eye, EyeOff } from "lucide-react";
import ConfirmDeleteDouble from "@/components/ConfirmDeleteDouble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Types basés sur le vrai schéma shared/schema.ts
interface CateringCategory {
  id: number;
  nameFr: string;
  nameEn: string;
  descriptionFr?: string;
  descriptionEn?: string;
  displayOrder: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  items?: CateringItem[];
}

interface CateringItem {
  id: number;
  categoryId: number;
  nameFr: string;
  nameEn: string;
  descriptionFr?: string;
  descriptionEn?: string;
  imageId?: number;
  displayOrder: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  prices?: CateringPrice[];
}

interface CateringPrice {
  id: number;
  itemId: number;
  sizeLabelFr: string;
  sizeLabelEn: string;
  price: number;
  isDefault: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function CateringMenuAdmin() {
  const [activeTab, setActiveTab] = useState("categories");
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    nameFr: "", 
    nameEn: "", 
    descriptionFr: "", 
    descriptionEn: "", 
    displayOrder: 0,
    isActive: 1
  });

  const [itemForm, setItemForm] = useState({
    categoryId: 0,
    nameFr: "",
    nameEn: "",
    descriptionFr: "",
    descriptionEn: "",
    imageId: null as number | null,
    displayOrder: 0,
    isActive: 1,
    prices: [] as Array<{
      sizeLabelFr: string;
      sizeLabelEn: string;
      price: string;
      isDefault: number;
      displayOrder: number;
    }>
  });

  // Auth check
  const { data: authUser, isLoading: isLoadingAuth } = useQuery({
    queryKey: ["auth-check"],
    queryFn: () => apiRequest("GET", "/api/admin/auth/me"),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - session admin
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
  });

  // Get catering categories (utilise les routes existantes)
  const { data: categories = [], isLoading, error, refetch } = useQuery<CateringCategory[]>({
    queryKey: ["catering-categories"],
    queryFn: () => apiRequest("GET", "/api/admin/catering-categories"),
    retry: 3,
    retryDelay: 1000,
    enabled: !!authUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - catégories modifiées occasionnellement
    gcTime: 20 * 60 * 1000, // 20 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Get complete catering menu (pour affichage public)
  const { data: completeCateringMenu } = useQuery<CateringCategory[]>({
    queryKey: ["catering-menu-complete"],
    queryFn: () => apiRequest("GET", "/api/admin/catering-menu"),
    enabled: !!authUser?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - menu complet
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Mutations pour les catégories
  const createCategoryMutation = useMutation({
    mutationFn: (data: typeof categoryForm) => 
      apiRequest("POST", "/api/admin/catering-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-categories"] });
      setShowCategoryDialog(false);
      resetCategoryForm();
      toast({ title: "Succès", description: "Catégorie créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la création de la catégorie", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof categoryForm> }) => 
      apiRequest("PATCH", `/api/admin/catering-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-categories"] });
      setEditingCategory(null);
      resetCategoryForm();
      toast({ title: "Succès", description: "Catégorie mise à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la mise à jour de la catégorie", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/catering-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-categories"] });
      queryClient.invalidateQueries({ queryKey: ["catering-items"] });
      toast({ title: "Succès", description: "Catégorie supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la suppression de la catégorie", variant: "destructive" });
    },
  });

  // Get catering items
  const { data: items } = useQuery<CateringItem[]>({
    queryKey: ["catering-items"],
    queryFn: () => apiRequest("GET", "/api/admin/catering-items"),
    enabled: !!authUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - items modifiés occasionnellement
    gcTime: 20 * 60 * 1000, // 20 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Mutations pour les items
  const createItemMutation = useMutation({
    mutationFn: (data: typeof itemForm) => {
      const dataToSend = {
        ...data,
        nameEn: data.nameEn.trim() || data.nameFr.trim(),
        descriptionFr: data.descriptionFr.trim() || null,
        descriptionEn: data.descriptionEn.trim() || null,
        prices: data.prices.map(p => ({
          ...p,
          price: parseFloat(p.price) || 0,
          sizeLabelEn: p.sizeLabelEn.trim() || p.sizeLabelFr.trim()
        }))
      };
      return apiRequest("POST", "/api/admin/catering-items", dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-items"] });
      queryClient.invalidateQueries({ queryKey: ["catering-menu-complete"] });
      setShowItemDialog(false);
      resetItemForm();
      toast({ title: "Succès", description: "Plat créé avec succès" });
    },
    onError: (error: any) => {
      console.error("Erreur création item:", error);
      toast({ title: "Erreur", description: "Échec de la création du plat", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof itemForm> }) => {
      const safe = (val: any) => typeof val === 'string' ? val : '';
      const dataToSend: any = {
        ...data,
        nameEn: safe(data.nameEn).trim() || safe(data.nameFr).trim(),
        descriptionFr: safe(data.descriptionFr).trim() || null,
        descriptionEn: safe(data.descriptionEn).trim() || null,
      };
      
      // Convert prices strings to numbers
      if (data.prices) {
        dataToSend.prices = data.prices.map(p => ({
          ...p,
          price: parseFloat(p.price) || 0
        }));
      }
      
      return apiRequest("PATCH", `/api/admin/catering-items/${id}`, dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-items"] });
      queryClient.invalidateQueries({ queryKey: ["catering-menu-complete"] });
      setShowItemDialog(false);
      setEditingItem(null);
      resetItemForm();
      toast({ title: "Succès", description: "Plat mis à jour avec succès" });
    },
    onError: (error: any) => {
      console.error("Erreur mise à jour item:", error);
      toast({ title: "Erreur", description: "Échec de la mise à jour du plat", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/catering-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-items"] });
      queryClient.invalidateQueries({ queryKey: ["catering-menu-complete"] });
      toast({ title: "Succès", description: "Plat supprimé avec succès" });
    },
    onError: (error: any) => {
      console.error("Erreur suppression item:", error);
      toast({ title: "Erreur", description: "Échec de la suppression du plat", variant: "destructive" });
    },
  });

  // Loading states
  if (isLoadingAuth) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!authUser?.id) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Accès non autorisé</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-destructive">Erreur lors du chargement du menu catering</p>
          <Button onClick={() => refetch()} className="mt-4">Réessayer</Button>
        </div>
      </AdminLayout>
    );
  }

  // Filter functions with safety checks
  const filteredCategories = (categories || []).filter(category => {
    const matchesSearch = searchTerm === "" || 
      category.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.nameEn && category.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesActive = !filterActiveOnly || category.isActive === 1;
    return matchesSearch && matchesActive;
  });

  const filteredItems = (items || []).filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesActive = !filterActiveOnly || item.isActive === 1;
    return matchesSearch && matchesActive;
  });

  const resetCategoryForm = () => {
    setCategoryForm({ 
      nameFr: "", 
      nameEn: "", 
      descriptionFr: "", 
      descriptionEn: "", 
      displayOrder: 0, 
      isActive: 1 
    });
    setEditingCategory(null);
  };

  const resetItemForm = () => {
    setItemForm({
      categoryId: 0,
      nameFr: "",
      nameEn: "",
      descriptionFr: "",
      descriptionEn: "",
      imageId: null,
      displayOrder: 0,
      isActive: 1,
      prices: []
    });
    setEditingItem(null);
    setShowItemDialog(false);
  };

  const handleAddItemToCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setItemForm(prev => ({ ...prev, categoryId: categoryId }));
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.nameFr.trim()) {
      toast({ title: "Erreur", description: "Le nom du plat est requis", variant: "destructive" });
      return;
    }
    
    // Utiliser le nom français si le nom anglais est vide
    const dataToSend = {
      ...itemForm,
      nameEn: itemForm.nameEn.trim() || itemForm.nameFr.trim(),
      descriptionEn: itemForm.descriptionEn.trim() || "",
      descriptionFr: itemForm.descriptionFr.trim() || ""
    };
    
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem, data: dataToSend });
    } else {
      createItemMutation.mutate(dataToSend);
    }
  };

  const handleAddPrice = () => {
    setItemForm(prev => ({
      ...prev,
      prices: [...prev.prices, {
        sizeLabelFr: "",
        sizeLabelEn: "",
        price: "",
        isDefault: prev.prices.length === 0 ? 1 : 0,
        displayOrder: prev.prices.length
      }]
    }));
  };

  const handleRemovePrice = (index: number) => {
    setItemForm(prev => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index)
    }));
  };

  const handleEditCategory = (category: CateringCategory) => {
    setCategoryForm({
      nameFr: category.nameFr,
      nameEn: category.nameEn,
      descriptionFr: category.descriptionFr || "",
      descriptionEn: category.descriptionEn || "",
      displayOrder: category.displayOrder,
      isActive: category.isActive
    });
    setEditingCategory(category.id);
  };

  const handleEditItem = (item: CateringItem) => {
    setItemForm({
      categoryId: item.categoryId,
      nameFr: item.nameFr,
      nameEn: item.nameEn || "",
      descriptionFr: item.descriptionFr || "",
      descriptionEn: item.descriptionEn || "",
      imageId: item.imageId || null,
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive,
      prices: item.prices && item.prices.length > 0 
        ? item.prices.map(p => ({
            sizeLabelFr: p.sizeLabelFr,
            sizeLabelEn: p.sizeLabelEn,
            price: p.price.toString(),
            isDefault: p.isDefault,
            displayOrder: p.displayOrder
          }))
        : []
    });
    setEditingItem(item.id);
    setShowItemDialog(true);
  };

  const handleSaveCategory = () => {
    // Nettoyer les données : convertir les chaînes vides en chaînes vides (pas null)
    const dataToSend = {
      ...categoryForm,
      nameEn: categoryForm.nameEn.trim() || categoryForm.nameFr.trim(), // Utiliser nameFr si nameEn vide
      descriptionFr: categoryForm.descriptionFr.trim() || "",
      descriptionEn: categoryForm.descriptionEn.trim() || "",
    };
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory, data: dataToSend });
    } else {
      createCategoryMutation.mutate(dataToSend);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
          <div>
            <h1 className="text-3xl font-bold">Gestion Menu Catering</h1>
            <p className="text-muted-foreground">
              Gérez les catégories de votre menu catering
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCategoryDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories Actives</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {categories?.filter(c => c.isActive === 1).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completeCateringMenu?.reduce((sum, cat) => sum + (cat.items?.length || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des catégories */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Catégories de Menu</h2>
          <div className="grid gap-4">
            {categories?.map(category => {
              const categoryItems = items?.filter(i => i.categoryId === category.id) || [];
              const activeItems = categoryItems.filter(i => i.isActive === 1);
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3 border-b">
                    {editingCategory === category.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nom (Français)</Label>
                            <Input value={categoryForm.nameFr} onChange={e=>setCategoryForm(p=>({...p,nameFr:e.target.value}))} />
                          </div>
                          <div>
                            <Label>Nom (Anglais)</Label>
                            <Input value={categoryForm.nameEn} onChange={e=>setCategoryForm(p=>({...p,nameEn:e.target.value}))} />
                          </div>
                        </div>
                        <div>
                          <Label>Description (Français)</Label>
                          <Textarea value={categoryForm.descriptionFr} onChange={e=>setCategoryForm(p=>({...p,descriptionFr:e.target.value}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <Label>Ordre</Label>
                            <Input type="number" value={categoryForm.displayOrder} onChange={e=>setCategoryForm(p=>({...p,displayOrder:parseInt(e.target.value)||0}))} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={categoryForm.isActive===1} onCheckedChange={ch=>setCategoryForm(p=>({...p,isActive:ch?1:0}))} />
                            <Label>Actif</Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveCategory}><Save className="w-4 h-4 mr-2" />Sauvegarder</Button>
                          <Button size="sm" variant="outline" onClick={resetCategoryForm}><X className="w-4 h-4 mr-2" />Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <CardTitle className="flex items-center gap-2">
                              {category.nameFr}
                              <Badge variant={category.isActive?"default":"secondary"}>{category.isActive?"Actif":"Inactif"}</Badge>
                            </CardTitle>
                            <Switch checked={category.isActive===1} onCheckedChange={ch=>updateCategoryMutation.mutate({id:category.id,data:{isActive:ch?1:0}})} />
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                            <span>{categoryItems.length} plat{categoryItems.length!==1?'s':''}</span>
                            <span>{activeItems.length} actifs</span>
                            <span>Ordre {category.displayOrder}</span>
                          </div>
                          <CardDescription>{category.nameEn}</CardDescription>
                          {category.descriptionFr && <p className="text-sm text-muted-foreground line-clamp-2">{category.descriptionFr}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>handleEditCategory(category)}><Edit2 className="w-4 h-4" /></Button>
                          <ConfirmDeleteDouble
                            trigger={<Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>}
                            title="Supprimer la catégorie"
                            description="Cette catégorie et tous ses plats seront définitivement supprimés."
                            itemName={category.nameFr}
                            extraInfo={<span>{(items||[]).filter(i=>i.categoryId===category.id).length} plat(s) impacté(s)</span>}
                            confirmWord="SUPPRIMER"
                            confirmLabel="Confirmer la suppression"
                            onConfirm={()=>deleteCategoryMutation.mutate(category.id)}
                          />
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">Créé: {new Date(category.createdAt).toLocaleDateString()}</p>
                        <Button size="sm" onClick={()=>handleAddItemToCategory(category.id)}><Plus className="w-4 h-4 mr-2" />Ajouter un plat</Button>
                      </div>
                      <div className="space-y-2">
                        {categoryItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
                            <div className="flex-1">
                              <h4 className="font-medium flex items-center gap-2">{item.nameFr}<Badge variant={item.isActive?"default":"secondary"}>{item.isActive?"Actif":"Inactif"}</Badge></h4>
                              {item.prices && item.prices.length>0 ? (
                                <p className="text-xs text-muted-foreground">{item.prices.map(p=>`${p.sizeLabelFr}: ${parseFloat(p.price as any || "0").toFixed(2)} CAD`).join(' | ')}</p>
                              ) : (
                                <p className="text-xs italic text-muted-foreground">Sur demande</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={item.isActive===1} onCheckedChange={ch=>updateItemMutation.mutate({id:item.id,data:{isActive:ch?1:0}})} />
                              <Button size="sm" variant="outline" onClick={()=>handleEditItem(item)}><Edit2 className="w-4 h-4" /></Button>
                              <ConfirmDeleteDouble
                                trigger={<Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                                title="Supprimer le plat"
                                description="Le plat et ses variantes de prix seront supprimés. Cette action est irréversible."
                                itemName={item.nameFr}
                                extraInfo={<span>{item.prices?.length||0} variante(s) de prix</span>}
                                confirmWord="SUPPRIMER"
                                confirmLabel="Supprimer le plat"
                                onConfirm={()=>deleteItemMutation.mutate(item.id)}
                              />
                            </div>
                          </div>
                        ))}
                        {categoryItems.length===0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun plat dans cette catégorie</p>}
                      </div>
                    </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Dialog pour nouvelle catégorie */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nouvelle Catégorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nameFr">Nom (Français) *</Label>
                  <Input
                    id="nameFr"
                    value={categoryForm.nameFr}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, nameFr: e.target.value }))}
                    placeholder=""
                  />
                </div>
                <div>
                  <Label htmlFor="nameEn">Nom (Anglais) *</Label>
                  <Input
                    id="nameEn"
                    value={categoryForm.nameEn}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="descriptionFr">Description (Français)</Label>
                <Textarea
                  id="descriptionFr"
                  value={categoryForm.descriptionFr}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, descriptionFr: e.target.value }))}
                  placeholder=""
                />
              </div>
              <div>
                <Label htmlFor="descriptionEn">Description (Anglais)</Label>
                <Textarea
                  id="descriptionEn"
                  value={categoryForm.descriptionEn}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  placeholder=""
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayOrder">Ordre d'affichage</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={categoryForm.isActive === 1}
                    onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, isActive: checked ? 1 : 0 }))}
                  />
                  <Label htmlFor="isActive">Catégorie active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveCategory}
                  disabled={!categoryForm.nameFr || !categoryForm.nameEn}
                >
                  Créer la catégorie
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour ajouter/modifier un plat */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Modifier le plat" : "Ajouter un plat"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2">
                <Switch
                  id="item_isActive_top"
                  checked={itemForm.isActive === 1}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isActive: checked ? 1 : 0 }))}
                />
                <Label htmlFor="item_isActive_top" className="font-semibold">Plat actif</Label>
              </div>
              
              <div>
                <Label htmlFor="item_nameFr">Nom (Français) *</Label>
                <Input
                  id="item_nameFr"
                  value={itemForm.nameFr}
                  onChange={(e) => setItemForm(prev => ({ ...prev, nameFr: e.target.value }))}
                  placeholder=""
                />
              </div>
              <div>
                <Label htmlFor="item_nameEn">Nom (Anglais) - optionnel</Label>
                <Input
                  id="item_nameEn"
                  value={itemForm.nameEn}
                  onChange={(e) => setItemForm(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder=""
                />
              </div>
              <div>
                <Label htmlFor="item_descriptionFr">Description (Français) - optionnel</Label>
                <Textarea
                  id="item_descriptionFr"
                  value={itemForm.descriptionFr || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, descriptionFr: e.target.value }))}
                  placeholder=""
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="item_descriptionEn">Description (Anglais) - optionnel</Label>
                <Textarea
                  id="item_descriptionEn"
                  value={itemForm.descriptionEn || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  placeholder=""
                  rows={2}
                />
              </div>

              {/* Gestion des prix */}
              <div className="border-t pt-4 bg-muted/20 -mx-6 px-6 pb-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-semibold">Prix et portions</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPrice}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un prix
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Laissez vide si le prix est "Sur demande". Ajoutez plusieurs prix pour des portions différentes (Petit/Grand).
                </p>
                <div className="space-y-3">
                  {itemForm.prices.map((priceItem, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Nom portion (FR)</Label>
                          <Input
                            placeholder=""
                            value={priceItem.sizeLabelFr}
                            onChange={(e) => {
                              const newPrices = [...itemForm.prices];
                              newPrices[index].sizeLabelFr = e.target.value;
                              setItemForm(prev => ({ ...prev, prices: newPrices }));
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Nom portion (EN)</Label>
                          <Input
                            placeholder=""
                            value={priceItem.sizeLabelEn}
                            onChange={(e) => {
                              const newPrices = [...itemForm.prices];
                              newPrices[index].sizeLabelEn = e.target.value;
                              setItemForm(prev => ({ ...prev, prices: newPrices }));
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Prix ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 10.99"
                            value={priceItem.price}
                            onChange={(e) => {
                              const newPrices = [...itemForm.prices];
                              newPrices[index].price = e.target.value;
                              setItemForm(prev => ({ ...prev, prices: newPrices }));
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={priceItem.isDefault === 1}
                              onCheckedChange={(checked) => {
                                const newPrices = itemForm.prices.map((p, i) => ({
                                  ...p,
                                  isDefault: i === index ? (checked ? 1 : 0) : 0
                                }));
                                setItemForm(prev => ({ ...prev, prices: newPrices }));
                              }}
                            />
                            <Label className="text-xs">Par défaut</Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePrice(index)}
                        className="mt-6"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {itemForm.prices.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      Aucun prix défini - le plat sera affiché avec "Sur demande"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetItemForm}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveItem}
                  disabled={!itemForm.nameFr}
                >
                  {editingItem ? "Mettre à jour" : "Créer le plat"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
