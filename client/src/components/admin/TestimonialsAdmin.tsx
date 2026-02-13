import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Trash2, Eye, EyeOff, Star, Plus, Edit3 } from "lucide-react";
import type { Testimonial } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MediaUploader from "./MediaUploader";

export default function TestimonialsAdmin() {
  const { toast } = useToast();
  const [selectedTestimonials, setSelectedTestimonials] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    clientName: "",
    comment: "",
    rating: 5,
    eventType: "",
    location: "",
    approved: 0,
    featured: 0
  });

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    queryFn: () => apiRequest("GET", "/api/admin/testimonials"),
  });

  // Create testimonial
  const createMutation = useMutation({
    mutationFn: async (data: typeof newTestimonial) => {
      return apiRequest("POST", "/api/admin/testimonials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Témoignage créé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setNewTestimonial({
      clientName: "",
      comment: "",
      rating: 5,
      eventType: "",
      location: "",
      approved: 0,
      featured: 0
    });
  };

  // Toggle approved status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      return apiRequest("PATCH", `/api/admin/testimonials/${id}`, { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      toast({ title: "Statut mis à jour" });
    }
  });

  // Delete testimonials
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return Promise.all(ids.map(id => 
        apiRequest("DELETE", `/api/admin/testimonials/${id}`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setSelectedTestimonials([]);
      toast({ title: "Témoignages supprimés" });
    }
  });

  const toggleSelection = (id: number) => {
    setSelectedTestimonials(prev =>
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
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
          <h2 className="text-2xl font-bold">Témoignages</h2>
          <p className="text-muted-foreground">{testimonials.length} témoignages • {selectedTestimonials.length} sélectionnés</p>
        </div>
        
        <div className="flex gap-2">
          {selectedTestimonials.length > 0 && (
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedTestimonials.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Voulez-vous vraiment supprimer {selectedTestimonials.length} témoignage(s) ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate(selectedTestimonials)}
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
                Nouveau Témoignage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un Témoignage</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau témoignage client
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Nom du client *</label>
                  <Input
                    value={newTestimonial.clientName || ""}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, clientName: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <MediaUploader
                    label="Photo du client"
                    mediaId={newTestimonial.clientPhotoId}
                    onMediaChange={(clientPhotoId) => {
                      setNewTestimonial({ ...newTestimonial, clientPhotoId });
                    }}
                    onMediaRemove={() => {
                      setNewTestimonial({ ...newTestimonial, clientPhotoId: null });
                    }}
                    accept="image/*"
                    mediaType="image"
                    description="Photo du client (optionnelle)"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Note *</label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= (newTestimonial.rating || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Commentaire *</label>
                  <Textarea
                    value={newTestimonial.comment || ""}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, comment: e.target.value })}
                    placeholder=""
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type d'événement</label>
                  <Input
                    value={newTestimonial.eventType || ""}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, eventType: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Lieu</label>
                  <Input
                    value={newTestimonial.location || ""}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, location: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approved"
                    checked={newTestimonial.approved === 1}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, approved: e.target.checked ? 1 : 0 })}
                    className="rounded"
                  />
                  <label htmlFor="approved" className="text-sm">Approuver immédiatement</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured-testimonial"
                    checked={newTestimonial.featured === 1}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, featured: e.target.checked ? 1 : 0 })}
                    className="rounded"
                  />
                  <label htmlFor="featured-testimonial" className="text-sm">Témoignage en vedette</label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(newTestimonial)}
                  disabled={!newTestimonial.clientName || !newTestimonial.comment || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="grid gap-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedTestimonials.includes(testimonial.id)}
                    onChange={() => toggleSelection(testimonial.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{testimonial.clientName}</h3>
                      <Badge variant={testimonial.approved ? "default" : "secondary"}>
                        {testimonial.approved ? "Approuvé" : "En attente"}
                      </Badge>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star 
                            key={i}
                            className={`h-4 w-4 ${
                              i < testimonial.rating 
                                ? "text-yellow-400 fill-current" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(testimonial.createdAt).toLocaleDateString()}
                    </p>
                    
                    <p className="text-sm">{testimonial.comment}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMutation.mutate({
                      id: testimonial.id,
                      approved: !testimonial.approved
                    })}
                  >
                    {testimonial.approved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun témoignage</h3>
            <p className="text-muted-foreground">
              Les témoignages de vos clients apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}