import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { refreshAdminAndPublicCache } from "@/lib/cacheUtils";
import { Plus, Pencil, Trash2, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema, type Event, type InsertEvent, type SiteInfo } from "@shared/schema";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { format } from "date-fns";

export default function Events() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    queryFn: () => apiRequest("GET", "/api/admin/events"),
    staleTime: 5 * 60 * 1000, // 5 minutes - événements admin
    gcTime: 20 * 60 * 1000, // 20 minutes en cache
    refetchOnWindowFocus: false,
  });

  const { data: siteInfo } = useQuery<SiteInfo>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings"),
    staleTime: 15 * 60 * 1000, // 15 minutes - paramètres admin
    gcTime: 60 * 60 * 1000, // 1h en cache
    refetchOnWindowFocus: false,
  });

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      shortExcerpt: "",
      activityDate: null,
      publishedAt: null,
      location: "",
      address: "",
      imageId: null,
      mediaAttachments: null,
      mediaGallery: null,
      postType: "activity",
      category: "general",
      status: "upcoming",
      price: "",
      isFree: false,
      maxParticipants: null,
      currentReservations: 0,
      requiresReservation: false,
      reservationDeadline: null,
      ticketTypes: null,
      contactInfo: "",
      featured: 0,
      isPinned: false,
      isPublished: true,
      authorId: null,
      engagementStats: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      const res = await apiRequest("POST", "/api/admin/events", data);
      return res;
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
  refreshAdminAndPublicCache("/api/admin/events");
      toast({ title: "Succès", description: "Événement créé avec succès" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de création de l'événement",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> }) => {
      const res = await apiRequest("PATCH", `/api/admin/events/${id}`, data);
      return res;
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
  refreshAdminAndPublicCache("/api/admin/events");
      toast({ title: "Succès", description: "Événement mis à jour avec succès" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de mise à jour de l'événement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/events/${id}`);
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
  refreshAdminAndPublicCache("/api/admin/events");
      toast({ title: "Succès", description: "Événement supprimé avec succès" });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de suppression de l'événement",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      form.reset({
        title: event.title,
        slug: event.slug,
        description: event.description || "",
        content: event.content || "",
        shortExcerpt: event.shortExcerpt || "",
        activityDate: event.activityDate ? new Date(event.activityDate) : null,
        publishedAt: event.publishedAt ? new Date(event.publishedAt) : null,
        location: event.location || "",
        address: event.address || "",
        imageId: event.imageId || null,
        mediaAttachments: event.mediaAttachments || null,
        mediaGallery: event.mediaGallery || null,
        postType: (event.postType as any) || "activity",
        category: event.category || "general",
        status: event.status || "upcoming",
        price: event.price || "",
        isFree: event.isFree || false,
        maxParticipants: event.maxParticipants || null,
        currentReservations: event.currentReservations || 0,
        requiresReservation: event.requiresReservation || false,
        reservationDeadline: event.reservationDeadline ? new Date(event.reservationDeadline) : null,
        ticketTypes: event.ticketTypes || null,
        contactInfo: event.contactInfo || "",
        featured: event.featured || 0,
        isPinned: event.isPinned || false,
        isPublished: event.isPublished !== false,
        authorId: event.authorId || null,
        engagementStats: event.engagementStats || null,
      });
    } else {
      setEditingEvent(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  const onSubmit = (data: InsertEvent) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    // Map to valid badge variants only (default | destructive | secondary | outline)
    switch (status) {
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      case "ongoing":
        return "default";
      default: // upcoming, others
        return "outline";
    }
  };

  const handleExportPDF = () => {
    if (!events) return;
    exportToPDF({
      title: "Rapport des Événements",
      fileName: `evenements-${format(new Date(), "yyyy-MM-dd")}`,
      companyInfo: {
        name: siteInfo?.businessName || "Dounie Cuisine",
        address: siteInfo?.address || undefined,
        phone: siteInfo?.phone1 || undefined,
        email: siteInfo?.emailPrimary || undefined,
      },
      columns: [
        { header: "Titre", field: "title" },
        { header: "Type", field: "postType" },
        { header: "Date", field: "activityDate" },
        { header: "Prix", field: "price" },
        { header: "Places", field: "maxParticipants" },
        { header: "Réservations", field: "currentReservations" },
      ],
      data: events.map(e => ({
        ...e,
        activityDate: e.activityDate ? format(new Date(e.activityDate), "dd/MM/yyyy") : "N/A",
        price: e.isFree ? "Gratuit" : (e.price ? `${e.price}$` : "N/A"),
        maxParticipants: e.maxParticipants || "Illimité",
        currentReservations: e.currentReservations || 0,
      })),
    });
    toast({ title: "Succès", description: "PDF exporté" });
  };

  const handleExportExcel = () => {
    if (!events) return;
    exportToExcel({
      title: "Rapport des Événements",
      fileName: `evenements-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "ID", field: "id" },
        { header: "Titre", field: "title" },
        { header: "Type", field: "postType" },
        { header: "Date", field: "activityDate" },
        { header: "Lieu", field: "location" },
        { header: "Prix", field: "price" },
        { header: "Gratuit", field: "isFree" },
        { header: "Places", field: "maxParticipants" },
        { header: "Réservations", field: "currentReservations" },
        { header: "Publié", field: "isPublished" },
      ],
      data: events.map(e => ({
        ...e,
        activityDate: e.activityDate ? format(new Date(e.activityDate), "dd/MM/yyyy HH:mm") : "",
      })),
    });
    toast({ title: "Succès", description: "Excel exporté" });
  };

  const handleExportCSV = () => {
    if (!events) return;
    exportToCSV({
      title: "Rapport des Événements",
      fileName: `evenements-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "Titre", field: "title" },
        { header: "Type", field: "postType" },
        { header: "Lieu", field: "location" },
        { header: "Statut", field: "status" },
      ],
      data: events,
    });
    toast({ title: "Succès", description: "CSV exporté" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Événements & Actualités
            </h1>
            <p className="text-muted-foreground">
              Gérer les événements, annonces et actualités du blog
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!events || events.length === 0}>
              <FileText className="w-4 h-4 mr-2" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!events || events.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!events || events.length === 0}>
              <FileDown className="w-4 h-4 mr-2" />CSV
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />Ajouter
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Réservations</TableHead>
                  <TableHead>Publié</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events && events.length > 0 ? (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.isPinned && <span className="text-orange-500 mr-1">📌</span>}
                        {event.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.postType}</Badge>
                      </TableCell>
                      <TableCell>
                        {event.activityDate
                          ? format(new Date(event.activityDate), "dd MMM yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {event.requiresReservation ? (
                          <>
                            {event.currentReservations || 0}
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {event.isPublished !== false ? (
                            <Badge variant="default" className="bg-green-600 text-white border-transparent">Oui</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-200 text-gray-600">Non</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMutation.mutate({ id: event.id, data: { isPublished: !(event.isPublished !== false) } })}
                          >
                            {event.isPublished !== false ? "Dépublier" : "Publier"}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={event.status || "upcoming"}
                          onValueChange={(val) => updateMutation.mutate({ id: event.id, data: { status: val as any } })}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">À venir</SelectItem>
                            <SelectItem value="ongoing">En cours</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Aucun événement trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog - I'll split this for clarity */}
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
              </DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? "Modifier les informations de l'événement"
                  : "Créer un nouvel événement, annonce ou actualité"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informations de base</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL) *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Ex: atelier-cuisine-haitienne
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortExcerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extrait court</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={2}
                            placeholder="Résumé affiché dans les listes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenu complet</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={6}
                            placeholder="Contenu détaillé de l'article"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Type & Category */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Classification</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "activity"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="activity">Activité</SelectItem>
                              <SelectItem value="announcement">Annonce</SelectItem>
                              <SelectItem value="promotion">Promotion</SelectItem>
                              <SelectItem value="menu_update">Menu</SelectItem>
                              <SelectItem value="opening_hours">Horaires</SelectItem>
                              <SelectItem value="special_event">Événement spécial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "general"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">Général</SelectItem>
                              <SelectItem value="gastronomie">Gastronomie</SelectItem>
                              <SelectItem value="atelier">Atelier</SelectItem>
                              <SelectItem value="brunch">Brunch</SelectItem>
                              <SelectItem value="culture">Culture</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "upcoming"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="upcoming">À venir</SelectItem>
                              <SelectItem value="ongoing">En cours</SelectItem>
                              <SelectItem value="completed">Terminé</SelectItem>
                              <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date activité</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={
                                field.value
                                  ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm")
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value ? new Date(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Localisation</h3>
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lieu</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Restaurant Dounie Cuisine"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Media */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Médias</h3>
                  
                  <FormField
                    control={form.control}
                    name="imageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image principale</FormLabel>
                        <ImageUpload
                          value={field.value}
                          onChange={(imageId) => field.onChange(imageId)}
                          label="Image de l'événement"
                          apiEndpoint="/api/admin/upload-media"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pricing & Reservations */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Prix et réservations</h3>
                  
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Événement gratuit</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!form.watch("isFree") && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (CAD)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              value={field.value || ""}
                              placeholder="45.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="requiresReservation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Nécessite réservation</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("requiresReservation") && (
                    <>
                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Places max</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseInt(e.target.value) : null)
                                }
                                placeholder="Illimité si vide"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reservationDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date limite réservation</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                value={
                                  field.value
                                    ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm")
                                    : ""
                                }
                                onChange={(e) =>
                                  field.onChange(e.target.value ? new Date(e.target.value) : null)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={2}
                            placeholder="Téléphone, email..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Publication */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Publication</h3>
                  
                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value !== false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Publié</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPinned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Épinglé</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === 1}
                              onCheckedChange={(checked) =>
                                field.onChange(checked ? 1 : 0)
                              }
                            />
                          </FormControl>
                          <FormLabel>Mis en avant</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Enregistrement..."
                      : editingEvent
                      ? "Mettre à jour"
                      : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'événement</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
