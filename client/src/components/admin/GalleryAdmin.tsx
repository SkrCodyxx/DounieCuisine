import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MultipleImageUpload } from "@/components/MultipleImageUpload";
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
  Upload, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  Plus,
  Edit3,
  Filter
} from "lucide-react";
import type { Gallery } from "@shared/schema";

export default function GalleryAdmin() {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<Gallery | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("tous");
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    category: "restaurant",
    alt: ""
  });
  const [bulkUploadData, setBulkUploadData] = useState({
    category: "restaurant",
    description: ""
  });

  // Récupérer les images de la galerie
  const { data: gallery, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/admin/gallery"],
    queryFn: () => apiRequest("GET", "/api/admin/gallery"),
  });

  // Catégories disponibles
  const categories = ["tous", ...Array.from(new Set(gallery?.map(g => g.category).filter((cat): cat is string => Boolean(cat)) || []))];

  // Filtrer par catégorie
  const filteredGallery = categoryFilter === "tous" 
    ? gallery 
    : gallery?.filter(g => g.category === categoryFilter);

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/admin/gallery", data);
    },
    onSuccess: () => {
      toast({ title: "Image téléchargée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); // Rafraîchir aussi la galerie publique
      setIsUploadDialogOpen(false);
      resetUploadForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors du téléchargement", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update image mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Gallery> }) => {
      return apiRequest("PATCH", `/api/admin/gallery/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Image mise à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setEditingImage(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete images mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageIds: number[]) => {
      return Promise.all(imageIds.map(id => 
        apiRequest("DELETE", `/api/admin/gallery/${id}`)
      ));
    },
    onSuccess: () => {
      toast({ title: "Images supprimées avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setSelectedImages([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Create gallery items from existing media assets (for bulk upload)
  const createGalleryItemsMutation = useMutation({
    mutationFn: async (items: Array<{mediaId: number; title: string; category: string; description?: string; altText?: string}>) => {
      return Promise.all(items.map(item => 
        apiRequest("POST", "/api/admin/gallery/from-media", item)
      ));
    },
    onSuccess: (results) => {
      toast({ 
        title: "Images ajoutées à la galerie", 
        description: `${results.length} image(s) ajoutée(s) avec succès` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setIsBulkUploadOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de l'ajout à la galerie", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadData({
      title: "",
      description: "",
      category: "restaurant",
      alt: ""
    });
  };

  const handleBulkUpload = (mediaIds: number[]) => {
    // Créer les éléments de galerie à partir des médias uploadés
    const galleryItems = mediaIds.map((mediaId, index) => ({
      mediaId,
      title: `Image ${index + 1}`, // Titre par défaut, peut être modifié après
      category: bulkUploadData.category,
      description: bulkUploadData.description || undefined,
      altText: `Image galerie ${index + 1}`
    }));

    createGalleryItemsMutation.mutate(galleryItems);
  };

  const handleUpload = () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append("image", uploadFile);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description || "");
    formData.append("category", uploadData.category);
    formData.append("alt", uploadData.alt);

    uploadMutation.mutate(formData);
  };

  const handleUpdateImage = () => {
    if (!editingImage) return;

    updateMutation.mutate({
      id: editingImage.id,
      data: {
        title: editingImage.title,
        description: editingImage.description,
        category: editingImage.category,
        active: editingImage.active
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return;
    deleteMutation.mutate(selectedImages);
  };

  const toggleImageSelection = (imageId: number) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
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
          <h2 className="text-2xl font-bold">Gestion de la Galerie</h2>
          <p className="text-muted-foreground">
            {filteredGallery?.length || 0} images • {selectedImages.length} sélectionnées
          </p>
        </div>
        <div className="flex gap-2">
          {selectedImages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedImages.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedImages.length} image(s) ? 
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
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Télécharger une Image</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle photo à votre galerie
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Fichier Image</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Catégorie</label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="plats">Plats</option>
                    <option value="events">Événements</option>
                    <option value="team">Équipe</option>
                    <option value="ambiance">Ambiance</option>
                    <option value="exterior">Extérieur</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadData.title || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Téléchargement..." : "Télécharger"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Multiple
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Multiple d'Images</DialogTitle>
                <DialogDescription>
                  Téléchargez plusieurs images en même temps dans la galerie
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Configuration globale pour l'upload en lot */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Catégorie par défaut</label>
                    <select
                      value={bulkUploadData.category}
                      onChange={(e) => setBulkUploadData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="plats">Plats</option>
                      <option value="evenements">Événements</option>
                      <option value="catering">Catering</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description par défaut</label>
                    <Input
                      value={bulkUploadData.description}
                      onChange={(e) => setBulkUploadData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Composant MultipleImageUpload */}
                <MultipleImageUpload
                  onImagesUploaded={handleBulkUpload}
                  maxFiles={20}
                  label="Sélectionnez jusqu'à 20 images"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                />
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsBulkUploadOpen(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Catégorie:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            {categories.map(category => (
              <option key={category || "unknown"} value={category || ""}>
                {category === "tous" ? "Toutes" : category || "Non catégorisé"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Images Grid */}
      {filteredGallery && filteredGallery.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGallery.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={`/api/media/${image.mediaId}`}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors">
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="rounded"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={image.active ? "default" : "secondary"}>
                      {image.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm truncate">{image.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {image.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {image.category}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/api/media/${image.mediaId}`, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingImage(image)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette image ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ceci supprimera l'entrée de galerie et éventuellement le fichier si plus utilisé ailleurs.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate([image.id])}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune image dans la galerie</h3>
          <p className="text-muted-foreground mb-4">
            {categoryFilter === "tous" 
              ? "Commencez par télécharger quelques photos de votre restaurant"
              : `Aucune image dans la catégorie "${categoryFilter}"`
            }
          </p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter votre première image
          </Button>
        </Card>
      )}

      {/* Edit Image Dialog */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'image</DialogTitle>
          </DialogHeader>
          
          {editingImage && (
            <div className="space-y-4">
              <div>
                <img
                  src={`/api/media/${editingImage.mediaId}`}
                  alt={editingImage.title}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={editingImage.title}
                  onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editingImage.description || ""}
                  onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Catégorie</label>
                <select
                  value={editingImage.category || "restaurant"}
                  onChange={(e) => setEditingImage({ ...editingImage, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="plats">Plats</option>
                  <option value="events">Événements</option>
                  <option value="team">Équipe</option>
                  <option value="ambiance">Ambiance</option>
                  <option value="exterior">Extérieur</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingImage.active === 1}
                  onChange={(e) => setEditingImage({ ...editingImage, active: e.target.checked ? 1 : 0 })}
                />
                <label className="text-sm">Image active (visible sur le site)</label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingImage(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateImage}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Mise à jour..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      {filteredGallery && filteredGallery.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques de la Galerie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{filteredGallery.length}</p>
                <p className="text-sm text-muted-foreground">Images totales</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredGallery.filter(img => img.active).length}
                </p>
                <p className="text-sm text-muted-foreground">Images actives</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
                <p className="text-sm text-muted-foreground">Catégories</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedImages.length}</p>
                <p className="text-sm text-muted-foreground">Sélectionnées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}