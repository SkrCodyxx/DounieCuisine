import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Calendar, Trash2, Eye, EyeOff, Plus, Edit3, DollarSign, Users, Clock } from "lucide-react";
import MediaUploader from "./MediaUploader";

type Event = any;

export default function EventsAdmin() {
  const { toast } = useToast();
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<any>({
    title: "",
    slug: "",
    description: "",
    activityDate: new Date().toISOString().split('T')[0],
    location: "",
    address: "",
    price: "",
    isFree: true,
    maxParticipants: "",
    unlimitedCapacity: true,
    category: "autre",
    status: "upcoming",
    featured: 0,
    eventTime: "",
    minGuests: 1
  });

  // Validation function
  const validateEvent = (eventData: typeof newEvent) => {
    const errors: string[] = [];
    
    if (!eventData.title?.trim()) {
      errors.push("Le titre est obligatoire");
    }
    
    if (!eventData.slug?.trim()) {
      errors.push("Le slug est obligatoire");
    }
    
    if (!eventData.activityDate) {
      errors.push("La date est obligatoire");
    }
    
    if (eventData.activityDate && new Date(eventData.activityDate) < new Date()) {
      errors.push("La date doit être dans le futur");
    }
    
    if (!eventData.isFree && (!eventData.price || parseFloat(eventData.price) < 0)) {
      errors.push("Le prix doit être un nombre positif pour un événement payant");
    }
    
    if (!eventData.unlimitedCapacity && (!eventData.maxParticipants || parseInt(eventData.maxParticipants) < 1)) {
      errors.push("Le nombre maximum de participants doit être d'au moins 1");
    }
    
    return errors;
  };

  // Reset form function
  const resetForm = () => {
    setNewEvent({
      title: "",
      slug: "",
      description: "",
      activityDate: new Date().toISOString().split('T')[0],
      location: "",
      address: "",
      price: "",
      isFree: true,
      maxParticipants: "",
      unlimitedCapacity: true,
      category: "autre",
      status: "upcoming",
      featured: 0,
      eventTime: "",
      minGuests: 1
    });
  };

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    queryFn: () => apiRequest("GET", "/api/admin/events"),
  });

  // Create event
  const createMutation = useMutation({
    mutationFn: async (data: typeof newEvent) => {
      // Validate before sending
      const validationErrors = validateEvent(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Prepare data for API
      const eventData = {
        ...data,
        price: data.isFree ? "0" : (data.price || "0"),
        maxParticipants: data.unlimitedCapacity ? null : (parseInt(data.maxParticipants) || 50),
        isFree: data.isFree,
        activityDate: new Date(data.activityDate).toISOString(),
      };

      return apiRequest("POST", "/api/admin/events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Événement créé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Update event
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const validationErrors = validateEvent(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      const eventData = {
        ...data,
        price: data.isFree ? "0" : (data.price || "0"),
        maxParticipants: data.unlimitedCapacity ? null : (parseInt(data.maxParticipants) || 50),
        isFree: data.isFree,
        activityDate: new Date(data.activityDate).toISOString(),
      };

      return apiRequest("PATCH", `/api/admin/events/${id}`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setEditingEvent(null);
      toast({ title: "Événement mis à jour" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  });

  // Delete events
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", `/api/admin/events/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setSelectedEvents([]);
      toast({ title: "Événements supprimés" });
    }
  });

  const toggleSelection = (id: number) => {
    setSelectedEvents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Événements</h2>
          <p className="text-muted-foreground">{events.length} événement(s) • {selectedEvents.length} sélectionné(s)</p>
        </div>
        
        <div className="flex gap-2">
          {selectedEvents.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedEvents.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedEvents.length} événement(s) ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate(selectedEvents)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un Événement</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouvel événement au calendrier
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Informations de base</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="title" className="text-sm font-medium">Titre *</label>
                      <Input
                        id="title"
                        value={newEvent.title || ""}
                        onChange={(e) => {
                          const title = e.target.value;
                          const slug = title.toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                          setNewEvent({ ...newEvent, title, slug });
                        }}
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label htmlFor="slug" className="text-sm font-medium">Slug *</label>
                      <Input
                        id="slug"
                        value={newEvent.slug || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <Textarea
                      id="description"
                      value={newEvent.description || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder=""
                      rows={4}
                    />
                  </div>
                </div>

                {/* Date & Location */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Date et lieu</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="activityDate" className="text-sm font-medium">Date *</label>
                      <Input
                        id="activityDate"
                        type="date"
                        value={newEvent.activityDate || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, activityDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="eventTime" className="text-sm font-medium">Heure</label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={newEvent.eventTime || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="location" className="text-sm font-medium">Lieu</label>
                      <Input
                        id="location"
                        value={newEvent.location || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="text-sm font-medium">Adresse complète</label>
                      <Input
                        id="address"
                        value={newEvent.address || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Tarification</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFree"
                      checked={newEvent.isFree}
                      onCheckedChange={(checked) => setNewEvent({ ...newEvent, isFree: checked, price: checked ? "" : newEvent.price })}
                    />
                    <label htmlFor="isFree" className="text-sm">Événement gratuit</label>
                  </div>
                  {!newEvent.isFree && (
                    <div className="w-1/3">
                      <label htmlFor="price" className="text-sm font-medium">Prix (CAD)</label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newEvent.price || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Capacité</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unlimitedCapacity"
                      checked={newEvent.unlimitedCapacity}
                      onCheckedChange={(checked) => setNewEvent({ ...newEvent, unlimitedCapacity: checked, maxParticipants: checked ? "" : newEvent.maxParticipants })}
                    />
                    <label htmlFor="unlimitedCapacity" className="text-sm">Capacité illimitée</label>
                  </div>
                  {!newEvent.unlimitedCapacity && (
                    <div className="w-1/3">
                      <label htmlFor="maxParticipants" className="text-sm font-medium">Nombre maximum de participants</label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        min="1"
                        value={newEvent.maxParticipants || ""}
                        onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  )}
                </div>

                {/* Image */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Image</h3>
                  <MediaUploader
                    label="Image de l'événement"
                    mediaId={newEvent.imageId}
                    onMediaChange={(imageId) => {
                      setNewEvent({ ...newEvent, imageId });
                    }}
                    onMediaRemove={() => {
                      setNewEvent({ ...newEvent, imageId: null });
                    }}
                    accept="image/*"
                    mediaType="image"
                    description="Image principale qui apparaîtra sur la page de l'événement"
                  />
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Paramètres</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="text-sm font-medium">Catégorie</label>
                      <Select
                        value={newEvent.category || "autre"}
                        onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="autre">Autre</SelectItem>
                          <SelectItem value="cuisine">Cuisine</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                          <SelectItem value="communaute">Communauté</SelectItem>
                          <SelectItem value="formation">Formation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="status" className="text-sm font-medium">Statut</label>
                      <Select
                        value={newEvent.status || "upcoming"}
                        onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">À venir</SelectItem>
                          <SelectItem value="ongoing">En cours</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={newEvent.featured === 1}
                      onCheckedChange={(checked) => setNewEvent({ ...newEvent, featured: checked ? 1 : 0 })}
                    />
                    <label htmlFor="featured" className="text-sm">Événement en vedette</label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(newEvent)}
                  disabled={!newEvent.title || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Events List */}
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleSelection(event.id)}
                  />
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.activityDate).toLocaleDateString('fr-FR')}
                        {event.eventTime && ` à ${event.eventTime}`}
                      </span>
                      {event.price && parseFloat(event.price) > 0 ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${parseFloat(event.price).toFixed(2)} CAD
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">Gratuit</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.maxParticipants ? `Max ${event.maxParticipants}` : 'Illimité'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                    {event.status === 'upcoming' ? 'À venir' : event.status}
                  </Badge>
                  {event.featured === 1 && (
                    <Badge variant="outline">En vedette</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Editing event:', event); // Debug
                      setEditingEvent({
                        id: event.id,
                        title: event.title || '',
                        slug: event.slug || '',
                        description: event.description || '',
                        activityDate: event.activityDate ? new Date(event.activityDate).toISOString().split('T')[0] : '',
                        eventTime: event.eventTime || '',
                        location: event.location || '',
                        address: event.address || '',
                        price: event.price || '',
                        isFree: !event.price || parseFloat(event.price) === 0,
                        maxParticipants: event.maxParticipants || '',
                        unlimitedCapacity: !event.maxParticipants,
                        category: event.category || 'autre',
                        status: event.status || 'upcoming',
                        featured: event.featured || 0,
                        imageId: event.imageId || null,
                        minGuests: event.minGuests || 1,
                      });
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {events.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun événement</h3>
              <p className="text-muted-foreground">
                Créez votre premier événement pour attirer des clients
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'Événement</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l'événement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Informations de base</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Titre *</label>
                    <Input
                      value={editingEvent.title || ""}
                      onChange={(e) => {
                        const title = e.target.value;
                        const slug = title.toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setEditingEvent({ ...editingEvent, title, slug });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug *</label>
                    <Input
                      value={editingEvent.slug || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, slug: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editingEvent.description || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>

              {/* Date & Location */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Date et lieu</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={editingEvent.activityDate || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, activityDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Heure</label>
                    <Input
                      type="time"
                      value={editingEvent.eventTime || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Lieu</label>
                    <Input
                      value={editingEvent.location || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Adresse complète</label>
                    <Input
                      value={editingEvent.address || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Tarification</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={Boolean(editingEvent.isFree)}
                    onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, isFree: Boolean(checked), price: checked ? "" : editingEvent.price })}
                  />
                  <label className="text-sm">Événement gratuit</label>
                </div>
                {!editingEvent.isFree && (
                  <div className="w-1/3">
                    <label className="text-sm font-medium">Prix (CAD)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingEvent.price || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Capacité</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={Boolean(editingEvent.unlimitedCapacity)}
                    onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, unlimitedCapacity: Boolean(checked), maxParticipants: checked ? "" : editingEvent.maxParticipants })}
                  />
                  <label className="text-sm">Capacité illimitée</label>
                </div>
                {!editingEvent.unlimitedCapacity && (
                  <div className="w-1/3">
                    <label className="text-sm font-medium">Nombre maximum de participants</label>
                    <Input
                      type="number"
                      min="1"
                      value={editingEvent.maxParticipants || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, maxParticipants: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Image */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Image</h3>
                <MediaUploader
                  label="Image de l'événement"
                  mediaId={editingEvent.imageId}
                  onMediaChange={(imageId) => setEditingEvent({ ...editingEvent, imageId })}
                  onMediaRemove={() => setEditingEvent({ ...editingEvent, imageId: null })}
                  accept="image/*"
                  mediaType="image"
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Paramètres</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select
                      value={editingEvent.category || "autre"}
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="autre">Autre</SelectItem>
                        <SelectItem value="cuisine">Cuisine</SelectItem>
                        <SelectItem value="culture">Culture</SelectItem>
                        <SelectItem value="communaute">Communauté</SelectItem>
                        <SelectItem value="formation">Formation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Statut</label>
                    <Select
                      value={editingEvent.status || "upcoming"}
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">À venir</SelectItem>
                        <SelectItem value="ongoing">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={editingEvent.featured === 1}
                    onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, featured: checked ? 1 : 0 })}
                  />
                  <label className="text-sm">Événement en vedette</label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Annuler
              </Button>
              <Button 
                onClick={() => updateMutation.mutate({ id: editingEvent.id, data: editingEvent })}
                disabled={!editingEvent.title || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
