import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import MediaUploader from "./MediaUploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  PlayCircle, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus,
  Edit3
} from "lucide-react";
import type { HeroSlide } from "@shared/schema";

export default function HeroSlidesAdmin() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const [newSlide, setNewSlide] = useState<Partial<Omit<HeroSlide, "id" | "createdAt" | "updatedAt">>>({
    dcId: `HERO-${Date.now()}`,
    title: "",
    mediaType: "image",
    textPosition: "center",
    logoSize: "medium",
    logoVisible: 1,
    displayOrder: 0,
    active: 1
  });

  // Récupérer les slides
  const { data: slides = [], isLoading, refetch } = useQuery<HeroSlide[]>({
    queryKey: ["/api/admin/hero-slides"],
    // Tente l'API admin, et bascule sur l'API publique si non authentifié (401)
    queryFn: async () => {
      try {
        const adminData = await apiRequest("GET", "/api/admin/hero-slides");
        return Array.isArray(adminData) ? adminData : [];
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : '';
        if (msg.startsWith("401")) {
          // Fallback: au moins afficher les slides actifs depuis l'API publique
          const publicData = await apiRequest("GET", "/api/hero-slides");
          return Array.isArray(publicData) ? publicData : [];
        }
        throw e;
      }
    },
  });

  // Create slide mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newSlide) => {
      return apiRequest("POST", "/api/admin/hero-slides", data);
    },
    onSuccess: () => {
      toast({ title: "Slide créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la création", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update slide mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HeroSlide> }) => {
      return apiRequest("PATCH", `/api/admin/hero-slides/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Slide mis à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      setEditingSlide(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete slides mutation
  const deleteMutation = useMutation({
    mutationFn: async (slideIds: number[]) => {
      return Promise.all(slideIds.map(id => 
        apiRequest("DELETE", `/api/admin/hero-slides/${id}`)
      ));
    },
    onSuccess: () => {
      toast({ title: "Slides supprimés avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      setSelectedSlides([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setNewSlide({
      dcId: `HERO-${Date.now()}`,
      title: "",
      mediaType: "image",
      textPosition: "center",
      logoSize: "medium",
      displayOrder: 0,
      active: 1
    });
  };

  const handleCreate = () => {
    createMutation.mutate(newSlide);
  };

  const handleUpdate = () => {
    if (!editingSlide) return;

    updateMutation.mutate({
      id: editingSlide.id,
      data: {
        title: editingSlide.title,
        mediaId: editingSlide.mediaId,
        mediaType: editingSlide.mediaType,
        textContent: editingSlide.textContent,
        textPosition: editingSlide.textPosition,
        logoId: editingSlide.logoId,
        logoSize: editingSlide.logoSize,
        logoVisible: editingSlide.logoVisible,
        active: editingSlide.active === 1 ? 1 : 0
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedSlides.length === 0) return;
    deleteMutation.mutate(selectedSlides);
  };

  const toggleSlideSelection = (slideId: number) => {
    setSelectedSlides(prev => 
      prev.includes(slideId) 
        ? prev.filter(id => id !== slideId)
        : [...prev, slideId]
    );
  };

  const handleReorder = (slideId: number, direction: "up" | "down") => {
    // TODO: Implement reordering when storage method is available
    toast({ 
      title: "Fonctionnalité non disponible", 
      description: "Le réordonnancement sera disponible prochainement",
      variant: "destructive"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion du Diaporama</h2>
          <p className="text-muted-foreground">
            {slides.length} slide(s) • {selectedSlides.length} sélectionné(s)
          </p>
        </div>
        <div className="flex gap-2">
          {selectedSlides.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedSlides.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedSlides.length} slide(s) ? 
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Slide</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau slide au carrousel de la page d'accueil
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    value={newSlide.title || ""}
                    onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type de média</label>
                  <select
                    value={newSlide.mediaType}
                    onChange={(e) => setNewSlide({ ...newSlide, mediaType: e.target.value as "image" | "video" })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <MediaUploader
                    label="Média principal *"
                    mediaId={newSlide.mediaId}
                    onMediaChange={(mediaId) => {
                      setNewSlide({ ...newSlide, mediaId });
                    }}
                    onMediaRemove={() => {
                      const { mediaId, ...rest } = newSlide;
                      setNewSlide(rest);
                    }}
                    accept={newSlide.mediaType === "video" ? "video/*" : "image/*"}
                    mediaType={newSlide.mediaType === "image" ? "image" : newSlide.mediaType === "video" ? "video" : "both"}
                    description="Uploadez une image ou vidéo, ou sélectionnez depuis la galerie"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(newSlide.logoVisible ?? 1) === 1}
                      onChange={(e) => setNewSlide({ ...newSlide, logoVisible: e.target.checked ? 1 : 0 })}
                    />
                    Afficher le logo sur ce slide
                  </label>
                </div>

                <div className="col-span-2">
                  <MediaUploader
                    label="Logo (optionnel)"
                    mediaId={newSlide.logoId}
                    onMediaChange={(logoId) => {
                      setNewSlide({ ...newSlide, logoId });
                    }}
                    onMediaRemove={() => {
                      setNewSlide({ ...newSlide, logoId: null });
                    }}
                    accept="image/*"
                    mediaType="image"
                    description="Logo affiché en superposition sur le slide"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Position du texte</label>
                  <select
                    value={newSlide.textPosition || "center"}
                    onChange={(e) => setNewSlide({ ...newSlide, textPosition: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="center">Centre</option>
                    <option value="top-left">Haut gauche</option>
                    <option value="top-center">Haut centre</option>
                    <option value="top-right">Haut droite</option>
                    <option value="center-left">Centre gauche</option>
                    <option value="center-right">Centre droite</option>
                    <option value="bottom-left">Bas gauche</option>
                    <option value="bottom-center">Bas centre</option>
                    <option value="bottom-right">Bas droite</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Taille du logo</label>
                  <select
                    value={newSlide.logoSize || "medium"}
                    onChange={(e) => setNewSlide({ ...newSlide, logoSize: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="small">Petit</option>
                    <option value="medium">Moyen</option>
                    <option value="large">Grand</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Contenu texte (JSON)</label>
                  <Textarea
                    value={newSlide.textContent || ""}
                    onChange={(e) => setNewSlide({ ...newSlide, textContent: e.target.value })}
                    placeholder='{"heading": "Bienvenue", "subheading": "Chez Dounie Cuisine", "buttonText": "Commander", "buttonLink": "/menu"}'
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format JSON avec heading, subheading, buttonText, buttonLink
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!newSlide.title || !newSlide.mediaId || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Slides Grid */}
      <div className="grid gap-4">
        {slides.map((slide) => (
          <Card key={slide.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedSlides.includes(slide.id)}
                    onChange={() => toggleSlideSelection(slide.id)}
                    className="mt-1"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{slide.title}</h3>
                      <Badge variant={slide.active ? "default" : "secondary"}>
                        {slide.active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="outline">
                        {slide.mediaType === "video" ? "Vidéo" : "Image"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      Position: {slide.textPosition || "centre"}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {slide.mediaType === "video" ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span>ID Média: {slide.mediaId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle active */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({
                      id: slide.id,
                      data: { active: slide.active === 1 ? 0 : 1 }
                    })}
                  >
                    {slide.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>

                  {/* Edit button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingSlide(slide)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {slides.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun slide</h3>
            <p className="text-muted-foreground">
              Créez votre premier slide pour commencer
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingSlide && (
        <Dialog open={!!editingSlide} onOpenChange={() => setEditingSlide(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le Slide</DialogTitle>
              <DialogDescription>
                Modifiez les informations du slide
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={editingSlide.title || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="Titre du slide"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Type de média</label>
                <select
                  value={editingSlide.mediaType || "image"}
                  onChange={(e) => setEditingSlide({ ...editingSlide, mediaType: e.target.value as "image" | "video" })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                >
                  <option value="image">Image</option>
                  <option value="video">Vidéo</option>
                </select>
              </div>

              <div className="col-span-2">
                <MediaUploader
                  label="Média principal *"
                  mediaId={editingSlide.mediaId}
                  onMediaChange={(mediaId) => {
                    setEditingSlide({ ...editingSlide, mediaId });
                  }}
                  onMediaRemove={() => {
                    setEditingSlide({ ...editingSlide, mediaId: null as any });
                  }}
                  accept={editingSlide.mediaType === "video" ? "video/*" : "image/*"}
                  mediaType={editingSlide.mediaType === "image" ? "image" : editingSlide.mediaType === "video" ? "video" : "both"}
                  description="Uploadez une image ou vidéo, ou sélectionnez depuis la galerie"
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 mt-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(editingSlide.logoVisible ?? 1) === 1}
                    onChange={(e) => setEditingSlide({ ...editingSlide, logoVisible: e.target.checked ? 1 : 0 })}
                  />
                  Afficher le logo sur ce slide
                </label>
              </div>

              <div className="col-span-2">
                <MediaUploader
                  label="Logo (optionnel)"
                  mediaId={editingSlide.logoId}
                  onMediaChange={(logoId) => {
                    setEditingSlide({ ...editingSlide, logoId });
                  }}
                  onMediaRemove={() => {
                    setEditingSlide({ ...editingSlide, logoId: null });
                  }}
                  accept="image/*"
                  mediaType="image"
                  description="Logo affiché en superposition sur le slide"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Position du texte</label>
                <select
                  value={editingSlide.textPosition || "center"}
                  onChange={(e) => setEditingSlide({ ...editingSlide, textPosition: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                >
                  <option value="center">Centre</option>
                  <option value="top-left">Haut gauche</option>
                  <option value="top-center">Haut centre</option>
                  <option value="top-right">Haut droite</option>
                  <option value="center-left">Centre gauche</option>
                  <option value="center-right">Centre droite</option>
                  <option value="bottom-left">Bas gauche</option>
                  <option value="bottom-center">Bas centre</option>
                  <option value="bottom-right">Bas droite</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Taille du logo</label>
                <select
                  value={editingSlide.logoSize || "medium"}
                  onChange={(e) => setEditingSlide({ ...editingSlide, logoSize: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                >
                  <option value="small">Petit</option>
                  <option value="medium">Moyen</option>
                  <option value="large">Grand</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Contenu texte (JSON)</label>
                <Textarea
                  value={editingSlide.textContent || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, textContent: e.target.value })}
                  placeholder='{"heading": "Bienvenue", "subheading": "Chez Dounie Cuisine", "buttonText": "Commander", "buttonLink": "/menu"}'
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format JSON avec heading, subheading, buttonText, buttonLink
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSlide(null)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}