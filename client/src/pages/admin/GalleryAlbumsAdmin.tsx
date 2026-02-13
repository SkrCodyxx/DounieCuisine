import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image as ImageIcon, Calendar, MapPin, Camera, Star, Eye } from "lucide-react";
import MediaSelector from "@/components/admin/MediaSelector";
import MultiMediaSelector from "@/components/admin/MultiMediaSelector";
import { parseApiError, formatErrorForToast, successMessages } from "@/lib/admin-errors";

interface GalleryAlbum {
  id: number;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  coverImageId: number | null;
  category: string;
  displayOrder: number;
  isActive: number;
  isFeatured: number;
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

interface GalleryPhoto {
  id: number;
  albumId: number;
  mediaId: number;
  title: string | null;
  description: string | null;
  displayOrder: number;
  isActive: number;
  createdAt: string;
}

interface MediaAsset {
  id: number;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  createdAt: string;
}

export default function GalleryAlbumsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [isEditMediaSelectorOpen, setIsEditMediaSelectorOpen] = useState(false);
  const [isPhotoMediaSelectorOpen, setIsPhotoMediaSelectorOpen] = useState(false);
  const [isMultiPhotoSelectorOpen, setIsMultiPhotoSelectorOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    coverImageId: null as number | null,
    category: "événements",
    displayOrder: 0,
    isActive: 1,
    isFeatured: 0,
  });

  const [photoFormData, setPhotoFormData] = useState({
    mediaId: null as number | null,
    title: "",
    description: "",
    displayOrder: 0,
  });

  // Fetch albums
  const { data: albums = [], isLoading } = useQuery<GalleryAlbum[]>({
    queryKey: ["/api/admin/gallery-albums"],
    queryFn: () => apiRequest("GET", "/api/admin/gallery-albums"),
  });

  // Fetch photos for selected album
  const { data: albumDetails } = useQuery<GalleryAlbum & { photos: GalleryPhoto[] }>({
    queryKey: [`/api/admin/gallery-albums/${selectedAlbum?.id}`],
    queryFn: () => apiRequest("GET", `/api/admin/gallery-albums/${selectedAlbum?.id}`),
    enabled: !!selectedAlbum,
  });

  // Create album mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/gallery-albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery-albums"] });
      toast(successMessages.create("Album"));
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast(formatErrorForToast(error, "Échec de la création de l'album"));
    },
  });

  // Update album mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await fetch(`/api/admin/gallery-albums/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery-albums"] });
      toast(successMessages.update("Album"));
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast(formatErrorForToast(error, "Échec de la modification de l'album"));
    },
  });

  // Delete album mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/gallery-albums/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery-albums"] });
      toast({
        ...successMessages.delete("Album"),
        description: "L'album et toutes ses photos ont été retirés de la galerie"
      });
    },
    onError: (error) => {
      toast(formatErrorForToast(error, "Échec de la suppression de l'album"));
    },
  });

  // Add photo to album mutation
  const addPhotoMutation = useMutation({
    mutationFn: async ({ albumId, data }: { albumId: number; data: typeof photoFormData }) => {
      const response = await fetch(`/api/admin/gallery-albums/${albumId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/gallery-albums/${selectedAlbum?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery-albums"] });
      toast({
        title: "📸 Photo ajoutée avec succès",
        description: "La photo a été ajoutée à l'album"
      });
      setIsAddPhotoDialogOpen(false);
      resetPhotoForm();
    },
    onError: (error) => {
      toast(formatErrorForToast(error, "Échec de l'ajout de la photo"));
    },
  });

  // Add multiple photos to album mutation
  const addMultiplePhotosMutation = useMutation({
    mutationFn: async ({ albumId, mediaIds }: { albumId: number; mediaIds: number[] }) => {
      // Ajouter toutes les photos en parallèle
      const promises = mediaIds.map((mediaId, index) => 
        fetch(`/api/admin/gallery-albums/${albumId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mediaId,
            title: "",
            description: "",
            displayOrder: index,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const error = await parseApiError(response);
            throw error;
          }
          return response.json();
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: (_, { mediaIds }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/gallery-albums/${selectedAlbum?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery-albums"] });
      toast({
        title: "📸 Photos ajoutées avec succès",
        description: `${mediaIds.length} photo${mediaIds.length > 1 ? 's' : ''} ajoutée${mediaIds.length > 1 ? 's' : ''} à l'album`
      });
    },
    onError: (error) => {
      toast(formatErrorForToast(error, "Échec de l'ajout des photos"));
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async ({ albumId, photoId }: { albumId: number; photoId: number }) => {
      const response = await fetch(`/api/admin/gallery-albums/${albumId}/photos/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/gallery-albums/${selectedAlbum?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery-albums"] });
      toast({
        title: "🗑️ Photo retirée avec succès",
        description: "La photo a été retirée de l'album (le fichier média reste disponible)"
      });
    },
    onError: (error) => {
      toast(formatErrorForToast(error, "Échec du retrait de la photo"));
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      location: "",
      coverImageId: null,
      category: "événements",
      displayOrder: 0,
      isActive: 1,
      isFeatured: 0,
    });
  };

  const resetPhotoForm = () => {
    setPhotoFormData({
      mediaId: null,
      title: "",
      description: "",
      displayOrder: 0,
    });
  };

  const handleEdit = (album: GalleryAlbum) => {
    setSelectedAlbum(album);
    setFormData({
      title: album.title,
      description: album.description || "",
      eventDate: album.eventDate ? album.eventDate.split('T')[0] : "",
      location: album.location || "",
      coverImageId: album.coverImageId,
      category: album.category,
      displayOrder: album.displayOrder,
      isActive: album.isActive,
      isFeatured: album.isFeatured,
    });
    setIsEditDialogOpen(true);
  };

  const handleManagePhotos = (album: GalleryAlbum) => {
    setSelectedAlbum(album);
    setIsPhotosDialogOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Non spécifiée";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Album
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouvel album</DialogTitle>
              <DialogDescription>
                Créez un album pour regrouper des photos d'un événement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de l'album *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Mariage Jean & Marie"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'événement..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">Date de l'événement</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Laval, QC"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="événements">Événements</SelectItem>
                    <SelectItem value="mariages">Mariages</SelectItem>
                    <SelectItem value="anniversaires">Anniversaires</SelectItem>
                    <SelectItem value="corporatif">Corporatif</SelectItem>
                    <SelectItem value="autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image de couverture</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMediaSelectorOpen(true)}
                  className="w-full justify-start"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {formData.coverImageId ? `Média #${formData.coverImageId}` : "Sélectionner une image"}
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive === 1}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
                  />
                  <Label>Album actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isFeatured === 1}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked ? 1 : 0 })}
                  />
                  <Label>Mettre en vedette</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.title || createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer l'album"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des albums */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : albums && albums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {album.coverImageId ? (
                  <img
                    src={`/api/media/${album.coverImageId}`}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {album.isFeatured === 1 && (
                    <Badge className="bg-yellow-500">
                      <Star className="w-3 h-3 mr-1" />
                      Vedette
                    </Badge>
                  )}
                  {album.isActive === 0 && (
                    <Badge variant="secondary">Inactif</Badge>
                  )}
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    <Camera className="w-3 h-3 mr-1" />
                    {album.photoCount || 0} photos
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{album.title}</CardTitle>
                {album.description && (
                  <CardDescription className="line-clamp-2">
                    {album.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  {album.eventDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(album.eventDate)}</span>
                    </div>
                  )}
                  {album.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{album.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleManagePhotos(album)}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Photos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(album)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer cet album ?")) {
                        deleteMutation.mutate(album.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/gallery/${album.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun album</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier album photo
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un album
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Edit Album */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titre de l'album *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-eventDate">Date de l'événement</Label>
                <Input
                  id="edit-eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Lieu</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="événements">Événements</SelectItem>
                  <SelectItem value="mariages">Mariages</SelectItem>
                  <SelectItem value="anniversaires">Anniversaires</SelectItem>
                  <SelectItem value="corporatif">Corporatif</SelectItem>
                  <SelectItem value="autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image de couverture</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMediaSelectorOpen(true)}
                className="w-full justify-start"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {formData.coverImageId ? `Média #${formData.coverImageId}` : "Sélectionner une image"}
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
                />
                <Label>Album actif</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isFeatured === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked ? 1 : 0 })}
                />
                <Label>Mettre en vedette</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedAlbum && updateMutation.mutate({ id: selectedAlbum.id, data: formData })}
              disabled={!formData.title || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Manage Photos */}
      <Dialog open={isPhotosDialogOpen} onOpenChange={setIsPhotosDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photos de l'album: {selectedAlbum?.title}</DialogTitle>
            <DialogDescription>
              {albumDetails?.photos.length || 0} photos dans cet album
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setIsMultiPhotoSelectorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter plusieurs photos
              </Button>
              <Button variant="outline" onClick={() => setIsAddPhotoDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une photo
              </Button>
            </div>
            {albumDetails?.photos && albumDetails.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {albumDetails.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={`/api/media/${photo.mediaId}`}
                      alt={photo.title || "Photo"}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Supprimer cette photo de l'album ?")) {
                            deletePhotoMutation.mutate({ albumId: selectedAlbum!.id, photoId: photo.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Aucune photo dans cet album</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Add Photo */}
      <Dialog open={isAddPhotoDialogOpen} onOpenChange={setIsAddPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des photos</DialogTitle>
            <DialogDescription>
              Sélectionnez une photo déjà uploadée pour l'ajouter à cet album
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sélectionner une photo *</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhotoMediaSelectorOpen(true)}
                className="w-full justify-start"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {photoFormData.mediaId ? `Média #${photoFormData.mediaId}` : "Sélectionner une photo"}
              </Button>
            </div>
            <div>
              <Label htmlFor="photo-title">Titre (optionnel)</Label>
              <Input
                id="photo-title"
                value={photoFormData.title}
                onChange={(e) => setPhotoFormData({ ...photoFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="photo-description">Description (optionnel)</Label>
              <Textarea
                id="photo-description"
                value={photoFormData.description}
                onChange={(e) => setPhotoFormData({ ...photoFormData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPhotoDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedAlbum && addPhotoMutation.mutate({ albumId: selectedAlbum.id, data: photoFormData })}
              disabled={!photoFormData.mediaId || addPhotoMutation.isPending}
            >
              {addPhotoMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MediaSelector Dialogs */}
      <MediaSelector
        open={isMediaSelectorOpen}
        onOpenChange={setIsMediaSelectorOpen}
        onSelect={(mediaId: number) => {
          setFormData({ ...formData, coverImageId: mediaId });
          setIsMediaSelectorOpen(false);
        }}
        currentMediaId={formData.coverImageId || undefined}
        mediaType="image"
      />

      <MediaSelector
        open={isEditMediaSelectorOpen}
        onOpenChange={setIsEditMediaSelectorOpen}
        onSelect={(mediaId: number) => {
          setFormData({ ...formData, coverImageId: mediaId });
          setIsEditMediaSelectorOpen(false);
        }}
        currentMediaId={formData.coverImageId || undefined}
        mediaType="image"
      />

      <MediaSelector
        open={isPhotoMediaSelectorOpen}
        onOpenChange={setIsPhotoMediaSelectorOpen}
        onSelect={(mediaId: number) => {
          setPhotoFormData({ ...photoFormData, mediaId: mediaId });
          setIsPhotoMediaSelectorOpen(false);
        }}
        currentMediaId={photoFormData.mediaId || undefined}
        mediaType="image"
      />

      {/* Multi Photo Selector */}
      <MultiMediaSelector
        open={isMultiPhotoSelectorOpen}
        onOpenChange={setIsMultiPhotoSelectorOpen}
        onSelect={(mediaIds: number[]) => {
          if (selectedAlbum) {
            addMultiplePhotosMutation.mutate({ albumId: selectedAlbum.id, mediaIds });
            setIsMultiPhotoSelectorOpen(false);
          }
        }}
        mediaType="image"
      />
    </div>
  );
}
