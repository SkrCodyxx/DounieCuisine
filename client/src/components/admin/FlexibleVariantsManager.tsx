import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit, Star, MoveUp, MoveDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invalidateDishVariants } from "@/lib/cacheUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface FlexibleVariant {
  id: number;
  dish_id: number;
  label: string;
  price: string | number;
  displayOrder: number;
  isDefault: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

interface FlexibleVariantsManagerProps {
  dishId: number;
  dishName: string;
}

export default function FlexibleVariantsManager({ dishId, dishName }: FlexibleVariantsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVariant, setEditingVariant] = useState<FlexibleVariant | null>(null);
  const [newVariant, setNewVariant] = useState({
    label: "",
    price: "",
    displayOrder: 0,
    isDefault: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get variants for this dish
  const { data: variants = [], isLoading } = useQuery<FlexibleVariant[]>({
    queryKey: [`/api/admin/dishes/${dishId}/variants`],
    queryFn: () => fetch(`/api/admin/dishes/${dishId}/variants`).then(res => res.json()),
  });

  // Add variant mutation
  const addVariantMutation = useMutation({
    mutationFn: (variantData: any) =>
      fetch(`/api/admin/dishes/${dishId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantData),
      }).then((res) => res.json()),
    onSuccess: async () => {
      // Utiliser la fonction spécialisée pour invalider tous les caches pertinents
      await invalidateDishVariants(dishId);
      
      setShowAddDialog(false);
      setNewVariant({ label: "", price: "", displayOrder: 0, isDefault: false });
      toast({
        title: "Variante ajoutée",
        description: "La variante a été ajoutée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la variante.",
        variant: "destructive",
      });
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, ...variantData }: any) =>
      fetch(`/api/admin/dishes/${dishId}/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantData),
      }).then((res) => res.json()),
    onSuccess: async () => {
      // Utiliser la fonction spécialisée pour invalider tous les caches pertinents
      await invalidateDishVariants(dishId);
      
      setEditingVariant(null);
      toast({
        title: "Variante mise à jour",
        description: "La variante a été mise à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la variante.",
        variant: "destructive",
      });
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: number) =>
      fetch(`/api/admin/dishes/${dishId}/variants/${variantId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      // Utiliser la fonction spécialisée pour invalider tous les caches pertinents
      await invalidateDishVariants(dishId);
      
      toast({
        title: "Variante supprimée",
        description: "La variante a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la variante.",
        variant: "destructive",
      });
    },
  });

  const handleAddVariant = () => {
    if (!newVariant.label || !newVariant.price) {
      toast({
        title: "Erreur",
        description: "Le nom et le prix sont requis.",
        variant: "destructive",
      });
      return;
    }

    addVariantMutation.mutate({
      label: newVariant.label,
      price: parseFloat(newVariant.price).toFixed(2),
      displayOrder: variants.length,
      isDefault: newVariant.isDefault,
    });
  };

  const handleUpdateVariant = () => {
    if (!editingVariant) return;

    updateVariantMutation.mutate({
      variantId: editingVariant.id,
      label: editingVariant.label,
      price: parseFloat(editingVariant.price.toString()).toFixed(2),
      displayOrder: editingVariant.displayOrder,
      isDefault: editingVariant.isDefault === 1,
    });
  };

  const handleDeleteVariant = (variantId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette variante ?")) {
      deleteVariantMutation.mutate(variantId);
    }
  };

  const moveVariant = (variantId: number, direction: 'up' | 'down') => {
    const sortedVariants = [...variants].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedVariants.findIndex(v => v.id === variantId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedVariants.length - 1)
    ) {
      return;
    }
    
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentVariant = sortedVariants[currentIndex];
    const swapVariant = sortedVariants[swapIndex];
    
    // Update display orders
    updateVariantMutation.mutate({
      variantId: currentVariant.id,
      label: currentVariant.label,
      price: currentVariant.price,
      displayOrder: swapVariant.displayOrder,
      isDefault: currentVariant.isDefault === 1,
    });
    
    updateVariantMutation.mutate({
      variantId: swapVariant.id,
      label: swapVariant.label,
      price: swapVariant.price,
      displayOrder: currentVariant.displayOrder,
      isDefault: swapVariant.isDefault === 1,
    });
  };

  if (isLoading) {
    return <div>Chargement des variantes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            Variantes Flexibles - {dishName}
            <p className="text-sm font-normal text-muted-foreground mt-1">
              Créez des variantes personnalisées (tailles, options, etc.) avec vos propres noms et prix
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Variante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle variante</DialogTitle>
                <DialogDescription>
                  Créez une variante personnalisée pour ce plat
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Nom de la variante</Label>
                  <Input
                    id="label"
                    placeholder=""
                    value={newVariant.label}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prix (CAD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder=""
                    value={newVariant.price}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={newVariant.isDefault}
                    onCheckedChange={(checked) => 
                      setNewVariant(prev => ({ ...prev, isDefault: checked as boolean }))
                    }
                  />
                  <Label htmlFor="isDefault">Variante par défaut</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddVariant} disabled={addVariantMutation.isPending}>
                    {addVariantMutation.isPending ? "Ajout..." : "Ajouter"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune variante configurée pour ce plat.</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter Variante" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variants
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((variant, index) => (
                <div key={variant.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.label}</span>
                      {variant.isDefault === 1 && (
                        <Badge variant="default" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Défaut
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${parseFloat(variant.price.toString()).toFixed(2)} CAD
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveVariant(variant.id, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveVariant(variant.id, 'down')}
                      disabled={index === variants.length - 1}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingVariant(variant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingVariant} onOpenChange={(open) => !open && setEditingVariant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la variante</DialogTitle>
              <DialogDescription>
                Modifiez les détails de cette variante
              </DialogDescription>
            </DialogHeader>
            {editingVariant && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-label">Nom de la variante</Label>
                  <Input
                    id="edit-label"
                    value={editingVariant.label}
                    onChange={(e) => setEditingVariant(prev => 
                      prev ? { ...prev, label: e.target.value } : null
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Prix (CAD)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingVariant.price}
                    onChange={(e) => setEditingVariant(prev => 
                      prev ? { ...prev, price: e.target.value } : null
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isDefault"
                    checked={editingVariant.isDefault === 1}
                    onCheckedChange={(checked) => 
                      setEditingVariant(prev => 
                        prev ? { ...prev, isDefault: checked ? 1 : 0 } : null
                      )
                    }
                  />
                  <Label htmlFor="edit-isDefault">Variante par défaut</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateVariant} disabled={updateVariantMutation.isPending}>
                    {updateVariantMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingVariant(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}