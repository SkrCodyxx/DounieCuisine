import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil, Trash2, Star, Check, X, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertTestimonialSchema,
  type Testimonial,
  type InsertTestimonial,
  type SiteInfo,
} from "@shared/schema";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";

export default function Testimonials() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    queryFn: () => apiRequest("GET", "/api/admin/testimonials"),
    staleTime: 10 * 60 * 1000, // 10 minutes - témoignages modifiés occasionnellement
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchOnWindowFocus: false,
  });

  const { data: siteInfo } = useQuery<SiteInfo>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings"),
    staleTime: 15 * 60 * 1000, // 15 minutes - paramètres admin
    gcTime: 60 * 60 * 1000, // 1h en cache
    refetchOnWindowFocus: false,
  });

  const form = useForm<InsertTestimonial>({
    resolver: zodResolver(insertTestimonialSchema),
    defaultValues: {
      clientName: "",
      clientPhotoId: null,
      rating: 5,
      comment: "",
      eventType: "",
      eventDate: null,
      location: "",
      featured: 0,
      approved: 0,
      displayOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTestimonial) =>
      apiRequest("POST", "/api/admin/testimonials", data),
    onSuccess: () => {
      refreshAdminAndPublicCache("/api/admin/testimonials");
      toast({
        title: "Succès",
        description: "Témoignage créé avec succès",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la création du témoignage",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertTestimonial>;
    }) => apiRequest("PATCH", `/api/admin/testimonials/${id}`, data),
    onSuccess: () => {
      refreshAdminAndPublicCache("/api/admin/testimonials");
      toast({
        title: "Succès",
        description: "Témoignage mis à jour avec succès",
      });
      setIsDialogOpen(false);
      setEditingTestimonial(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du témoignage",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/testimonials/${id}`, undefined),
    onSuccess: () => {
      refreshAdminAndPublicCache("/api/admin/testimonials");
      toast({
        title: "Succès",
        description: "Témoignage supprimé avec succès",
      });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la suppression du témoignage",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      form.reset({
        clientName: testimonial.clientName,
        clientPhotoId: testimonial.clientPhotoId || null,
        rating: testimonial.rating,
        comment: testimonial.comment,
        eventType: testimonial.eventType || "",
        eventDate: testimonial.eventDate ? new Date(testimonial.eventDate) : null,
        location: testimonial.location || "",
        featured: testimonial.featured,
        approved: testimonial.approved,
        displayOrder: testimonial.displayOrder || 0,
      });
    } else {
      setEditingTestimonial(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    form.reset();
  };

  const handleApprove = (id: number, approved: boolean) => {
    updateMutation.mutate({ id, data: { approved: approved ? 1 : 0 } });
  };

  const onSubmit = (data: InsertTestimonial) => {
    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleExportPDF = () => {
    if (!testimonials) return;
    exportToPDF({
      title: "Rapport des Témoignages",
      fileName: `temoignages-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [{ header: "Client", field: "clientName", width: 25 }, { header: "Note", field: "rating", width: 12 }, { header: "Commentaire", field: "comment", width: 50 }],
      data: testimonials,
      companyInfo: { name: siteInfo?.businessName || "Dounie Cuisine" },
    });
    toast({ title: "Succès", description: "PDF exporté" });
  };

  const handleExportExcel = () => {
    if (!testimonials) return;
    exportToExcel({
      title: "Rapport des Témoignages",
      fileName: `temoignages-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [{ header: "ID", field: "id" }, { header: "Client", field: "clientName", width: 25 }, { header: "Note", field: "rating", width: 12 }],
      data: testimonials,
      companyInfo: { name: siteInfo?.businessName || "Dounie Cuisine" },
    });
    toast({ title: "Succès", description: "Excel exporté" });
  };

  const handleExportCSV = () => {
    if (!testimonials) return;
    exportToCSV({
      title: "Rapport des Témoignages",
      fileName: `temoignages-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [{ header: "Client", field: "clientName" }, { header: "Note", field: "rating" }],
      data: testimonials,
    });
    toast({ title: "Succès", description: "CSV exporté" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-testimonials-title">
              Testimonials
            </h1>
            <p className="text-muted-foreground" data-testid="text-testimonials-subtitle">
              Manage customer testimonials and reviews
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!testimonials || testimonials.length === 0} data-testid="button-export-pdf">
              <FileText className="w-4 h-4 mr-2" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!testimonials || testimonials.length === 0} data-testid="button-export-excel">
              <FileSpreadsheet className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!testimonials || testimonials.length === 0} data-testid="button-export-csv">
              <FileDown className="w-4 h-4 mr-2" />CSV
            </Button>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-testimonial">
              <Plus className="mr-2 h-4 w-4" />Add Testimonial
            </Button>
          </div>
        </div>

        {/* Table */}
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials && testimonials.length > 0 ? (
                  testimonials.map((testimonial) => (
                    <TableRow
                      key={testimonial.id}
                      data-testid={`row-testimonial-${testimonial.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-testimonial-name-${testimonial.id}`}>
                        {testimonial.clientName}
                      </TableCell>
                      <TableCell data-testid={`rating-testimonial-${testimonial.id}`}>
                        {renderStars(testimonial.rating)}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {testimonial.comment}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={testimonial.approved ? "default" : "secondary"}
                          data-testid={`badge-testimonial-approved-${testimonial.id}`}
                        >
                          {testimonial.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(testimonial.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!testimonial.approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(testimonial.id, true)}
                              data-testid={`button-approve-testimonial-${testimonial.id}`}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {testimonial.approved === 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(testimonial.id, false)}
                              data-testid={`button-reject-testimonial-${testimonial.id}`}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(testimonial)}
                            data-testid={`button-edit-testimonial-${testimonial.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(testimonial.id)}
                            data-testid={`button-delete-testimonial-${testimonial.id}`}
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
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                      data-testid="text-no-testimonials"
                    >
                      Aucun témoignage trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl" data-testid="dialog-testimonial-form">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
              </DialogTitle>
              <DialogDescription>
                {editingTestimonial
                  ? "Update testimonial information"
                  : "Create a new customer testimonial"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-testimonial-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment *</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-testimonial-comment" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5) *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-testimonial-rating">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="" data-testid="input-testimonial-event-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Location</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="" data-testid="input-testimonial-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value?.toString() || "0"}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          data-testid="input-testimonial-display-order" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                            data-testid="checkbox-testimonial-featured"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="approved"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === 1}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? 1 : 0)
                            }
                            data-testid="checkbox-testimonial-approved"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Approved</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel-testimonial"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    data-testid="button-save-testimonial"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingTestimonial
                      ? "Update"
                      : "Create"}
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
          <AlertDialogContent data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this testimonial? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteConfirmId && deleteMutation.mutate(deleteConfirmId)
                }
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
