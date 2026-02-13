import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface Side {
  id: number;
  name: string;
  description?: string;
  price: number;
  isActive: number;
}

interface SidesManagerProps {
  dishId?: number | null;
}

export default function SidesManager({ dishId }: SidesManagerProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });

  // Queries
  const { data: sides = [], isError: sidesError, error: sidesErrorMsg } = useQuery<Side[]>({
    queryKey: ["sides"],
    queryFn: () => apiRequest("GET", "/api/admin/sides"),
    throwOnError: false,
  });

  const { data: dishSides = [], isError: dishSidesError, error: dishSidesErrorMsg } = useQuery<Side[]>({
    queryKey: ["dish-sides", dishId],
    queryFn: () => apiRequest("GET", `/api/admin/dishes/${dishId}/sides`),
    enabled: !!dishId,
    throwOnError: false,
  });

  // Helper function to normalize price
  const normalizePrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Mutations
  const createSideMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/admin/sides", {
        name: data.name,
        description: data.description || null,
        price: normalizePrice(data.price),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sides"] });
      setShowDialog(false);
      resetForm();
      toast({ title: "✅ Accompagnement créé", description: "L'accompagnement a été ajouté" });
    },
    onError: (error: any) => {
      console.error("Error creating side:", error);
      const errorMsg = error?.response?.data?.message || error?.message || JSON.stringify(error);
      toast({
        title: "❌ Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const updateSideMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/admin/sides/${id}`, {
        name: data.name,
        description: data.description || null,
        price: normalizePrice(data.price),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sides"] });
      setShowDialog(false);
      setEditingId(null);
      resetForm();
      toast({ title: "✅ Accompagnement modifié", description: "Les modifications ont été enregistrées" });
    },
    onError: (error: any) => {
      console.error("Error updating side:", error);
      const errorMsg = error?.response?.data?.message || error?.message || JSON.stringify(error);
      toast({
        title: "❌ Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const deleteSideMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/sides/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sides"] });
      setDeleteAlert(null);
      toast({ title: "✅ Accompagnement supprimé", description: "L'accompagnement a été retiré" });
    },
    onError: (error: any) => {
      console.error("Error deleting side:", error);
      const errorMsg = error?.response?.data?.message || error?.message || JSON.stringify(error);
      toast({
        title: "❌ Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const addSideToDishMutation = useMutation({
    mutationFn: (sideId: number) =>
      apiRequest("POST", `/api/admin/dishes/${dishId}/sides/${sideId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dish-sides", dishId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] }); // ✅ Invalider liste globale
      queryClient.invalidateQueries({ queryKey: [`/api/admin/dishes/${dishId}`] }); // ✅ Invalider plat spécifique
      toast({ title: "✅ Accompagnement ajouté", description: "L'accompagnement a été lié au plat" });
    },
    onError: (error: any) => {
      console.error("Error adding side to dish:", error);
      const errorMsg = error?.response?.data?.message || error?.message || JSON.stringify(error);
      toast({
        title: "❌ Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const removeSideFromDishMutation = useMutation({
    mutationFn: (sideId: number) =>
      apiRequest("DELETE", `/api/admin/dishes/${dishId}/sides/${sideId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dish-sides", dishId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] }); // ✅ Invalider liste globale
      queryClient.invalidateQueries({ queryKey: [`/api/admin/dishes/${dishId}`] }); // ✅ Invalider plat spécifique
      toast({ title: "✅ Accompagnement retiré", description: "L'accompagnement a été détaché du plat" });
    },
    onError: (error: any) => {
      console.error("Error removing side from dish:", error);
      const errorMsg = error?.response?.data?.message || error?.message || JSON.stringify(error);
      toast({
        title: "❌ Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", price: "" });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Erreur", description: "Le nom est requis", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateSideMutation.mutate({ id: editingId, data: form });
    } else {
      createSideMutation.mutate(form);
    }
  };

  const handleEdit = (side: Side) => {
    setEditingId(side.id);
    setForm({
      name: side.name,
      description: side.description || "",
      price: side.price.toString(),
    });
    setShowDialog(true);
  };

  const openNewDialog = () => {
    resetForm();
    setEditingId(null);
    setShowDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Show errors if queries fail */}
      {sidesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 text-sm">
              ❌ Erreur lors du chargement des accompagnements: {String(sidesErrorMsg || "Erreur inconnue")}
            </p>
          </CardContent>
        </Card>
      )}

      {dishSidesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 text-sm">
              ❌ Erreur lors du chargement des accompagnements du plat: {String(dishSidesErrorMsg || "Erreur inconnue")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gestion des accompagnements globaux */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📋 Gestion des accompagnements</CardTitle>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter accompagnement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sides.map((side) => (
              <div key={side.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{side.name}</p>
                  {side.description && <p className="text-sm text-muted-foreground">{side.description}</p>}
                  {parseFloat(side.price as any || "0") > 0 && <Badge variant="outline">${parseFloat(side.price as any || "0").toFixed(2)} CAD</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(side)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteAlert(side.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lier accompagnements au plat */}
      {dishId && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle>🍴 Accompagnements de ce plat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dishSides.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun accompagnement lié</p>
              ) : (
                dishSides.map((side) => (
                  <div key={side.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{side.name}</p>
                      {parseFloat(side.price as any || "0") > 0 && <Badge variant="secondary">${parseFloat(side.price as any || "0").toFixed(2)} CAD</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeSideFromDishMutation.mutate(side.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}

              {/* Ajouter accompagnement au plat */}
              {sides.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Ajouter un accompagnement:</p>
                  <div className="space-y-2">
                    {sides
                      .filter((s) => !dishSides.find((ds) => ds.id === s.id))
                      .map((side) => (
                        <Button
                          key={side.id}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addSideToDishMutation.mutate(side.id)}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          {side.name}
                          {parseFloat(side.price as any || "0") > 0 && <span className="ml-auto text-xs">${parseFloat(side.price as any || "0").toFixed(2)} CAD</span>}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogue de création/édition */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier accompagnement" : "Créer accompagnement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="side-name">Nom *</Label>
              <Input
                id="side-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="side-description">Description</Label>
              <Textarea
                id="side-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder=""
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="side-price">Prix ($)</Label>
              <Input
                id="side-price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder=""
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={deleteAlert !== null} onOpenChange={() => setDeleteAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Assurez-vous que cet accompagnement n'est pas utilisé par les plats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteAlert) deleteSideMutation.mutate(deleteAlert);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
