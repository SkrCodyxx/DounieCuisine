import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, FileDown, FileSpreadsheet, FileText, Eye, XCircle, Trash2 } from "lucide-react";
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
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export";
import { format } from "date-fns";
import type { SiteInfo } from "@shared/schema";

interface EventBooking {
  id: number;
  eventId?: number | null;
  event?: { id: number; title: string } | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  eventTime?: string;
  guestsCount: number;
  menuType?: string | null;
  location?: string | null;
  specialRequests?: string | null;
  depositAmount?: string | null;
  status: string;
  totalEstimate?: string | null;
  adminNotes?: string | null;
  confirmedByAdminId?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export default function EventBookings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);

  const { data: bookings = [], isLoading } = useQuery<EventBooking[]>({
    queryKey: ["/api/admin/event-bookings"],
  });

  const { data: siteInfo } = useQuery<SiteInfo>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/event-bookings/${id}`, { status });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-bookings"] });
      toast({ title: "Succès", description: "Statut de la réservation mis à jour" });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de mise à jour du statut",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/event-bookings/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-bookings"] });
      toast({ title: "Réservation supprimée", description: "La réservation a été supprimée avec succès." });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la suppression",
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings?.filter((booking) => {
    const matchesSearch =
      searchQuery === "" ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.menuType || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    // Map booking status to allowed badge variants
    switch (status) {
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      case "confirmed":
        return "default";
      default: // pending
        return "outline";
    }
  };

  const handleExportPDF = () => {
    if (!filteredBookings) return;
    exportToPDF({
      title: "Rapport des Réservations d'Événements",
      fileName: `reservations-${format(new Date(), "yyyy-MM-dd")}`,
      companyInfo: {
        name: siteInfo?.businessName || "Dounie Cuisine",
        address: siteInfo?.address || undefined,
        phone: siteInfo?.phone1 || undefined,
        email: siteInfo?.emailPrimary || undefined,
      },
      columns: [
        { header: "ID", field: "id" },
        { header: "Événement", field: "eventTitle" },
        { header: "Client", field: "customerName" },
        { header: "Email", field: "customerEmail" },
        { header: "Date", field: "eventDate" },
        { header: "Invités", field: "numberOfGuests" },
        { header: "Total", field: "totalEstimate" },
        { header: "Statut", field: "status" },
      ],
      data: filteredBookings.map((b) => ({
        ...b,
        eventTitle: b.menuType || "Événement personnalisé",
        eventDate: format(new Date(b.eventDate), "dd/MM/yyyy"),
        totalEstimate: b.totalEstimate ? `${b.totalEstimate}$` : "N/A",
      })),
    });
    toast({ title: "Succès", description: "PDF exporté" });
  };

  const handleExportExcel = () => {
    if (!filteredBookings) return;
    exportToExcel({
      title: "Rapport des Réservations",
      fileName: `reservations-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "ID", field: "id" },
        { header: "Événement", field: "eventTitle" },
        { header: "Client", field: "customerName" },
        { header: "Email", field: "customerEmail" },
        { header: "Téléphone", field: "customerPhone" },
        { header: "Date événement", field: "eventDate" },
        { header: "Heure", field: "eventTime" },
        { header: "Nombre invités", field: "numberOfGuests" },
        { header: "Total", field: "totalEstimate" },
        { header: "Statut", field: "status" },
        { header: "Créé le", field: "createdAt" },
      ],
      data: filteredBookings.map((b) => ({
        ...b,
        eventTitle: b.menuType || "Événement personnalisé",
        eventDate: format(new Date(b.eventDate), "dd/MM/yyyy"),
        createdAt: format(new Date(b.createdAt), "dd/MM/yyyy HH:mm"),
      })),
    });
    toast({ title: "Succès", description: "Excel exporté" });
  };

  const handleExportCSV = () => {
    if (!filteredBookings) return;
    exportToCSV({
      title: "Rapport des Réservations",
      fileName: `reservations-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "Client", field: "customerName" },
        { header: "Email", field: "customerEmail" },
        { header: "Invités", field: "numberOfGuests" },
        { header: "Statut", field: "status" },
      ],
      data: filteredBookings,
    });
    toast({ title: "Succès", description: "CSV exporté" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Réservations d'Événements
            </h1>
            <p className="text-muted-foreground">
              Gérer les réservations et billets d'événements
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={!filteredBookings || filteredBookings.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={!filteredBookings || filteredBookings.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!filteredBookings || filteredBookings.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher par nom, email, événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        {bookings && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">En attente</div>
              <div className="text-2xl font-bold">
                {bookings.filter((b) => b.status === "pending").length}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Confirmées</div>
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter((b) => b.status === "confirmed").length}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Annulées</div>
              <div className="text-2xl font-bold text-red-600">
                {bookings.filter((b) => b.status === "cancelled").length}
              </div>
            </div>
          </div>
        )}

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
                  <TableHead>ID</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invités</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings && filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        #{booking.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.menuType || "Événement personnalisé"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.eventDate), "dd MMM yyyy")}
                        {booking.eventTime && (
                          <span className="text-muted-foreground ml-1">
                            {booking.eventTime}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{booking.guestsCount}</TableCell>
                      <TableCell>
                        {booking.totalEstimate ? (
                          <span className="font-medium">{booking.totalEstimate}$</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: booking.id,
                                  status: "cancelled",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la réservation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Voulez-vous vraiment supprimer la réservation #{booking.id} ?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBookingMutation.mutate(booking.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Aucune réservation trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Details Dialog */}
        <Dialog
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la réservation #{selectedBooking?.id}</DialogTitle>
              <DialogDescription>
                Informations complètes sur la réservation
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                {/* Event Info */}
                <div>
                  <h3 className="font-semibold mb-2">Événement</h3>
                  <p className="text-lg">
                    {selectedBooking.menuType || "Événement personnalisé"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedBooking.eventDate), "dd MMMM yyyy")}
                    {selectedBooking.eventTime && ` à ${selectedBooking.eventTime}`}
                  </p>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-2">Client</h3>
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Nom:</span>{" "}
                      {selectedBooking.customerName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedBooking.customerEmail}
                    </p>
                    <p>
                      <span className="font-medium">Téléphone:</span>{" "}
                      {selectedBooking.customerPhone}
                    </p>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="font-semibold mb-2">Détails</h3>
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Nombre d'invités:</span>{" "}
                      {selectedBooking.guestsCount}
                    </p>
                    {selectedBooking.specialRequests && (
                      <p>
                        <span className="font-medium">Demandes spéciales:</span>{" "}
                        <span className="whitespace-pre-wrap">{selectedBooking.specialRequests}</span>
                      </p>
                    )}
                    
                    {selectedBooking.totalEstimate && (
                      <p>
                        <span className="font-medium">Montant total:</span>{" "}
                        {selectedBooking.totalEstimate}$
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Statut:</span>{" "}
                      <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>
                        {selectedBooking.status}
                      </Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Réservé le{" "}
                      {format(new Date(selectedBooking.createdAt), "dd/MM/yyyy à HH:mm")}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {selectedBooking.status !== "cancelled" && (
                  <div className="flex gap-2">
                    {selectedBooking.status === "pending" && (
                      <Button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: selectedBooking.id,
                            status: "confirmed",
                          })
                        }
                      >
                        Confirmer
                      </Button>
                    )}
                    {selectedBooking.status === "confirmed" && (
                      <Button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: selectedBooking.id,
                            status: "completed",
                          })
                        }
                      >
                        Marquer terminé
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedBooking.id,
                          status: "cancelled",
                        })
                      }
                    >
                      Annuler
                    </Button>
                  </div>
                )}
                {/* Delete action */}
                <div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer la réservation
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la réservation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Voulez-vous vraiment supprimer la réservation #{selectedBooking?.id} ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => selectedBooking && deleteBookingMutation.mutate(selectedBooking.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
