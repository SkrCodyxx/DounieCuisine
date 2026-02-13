import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Eye, Search, DollarSign, Users, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type EventBooking = {
  id: number;
  eventId: number;
  eventName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfGuests: number;
  eventDate: string;
  eventTime: string;
  status: string;
  totalEstimate: number;
  specialRequests: string;
  createdAt: string;
  paymentStatus?: string;
};

export default function EventReservationsAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);

  const { data: bookings = [], isLoading } = useQuery<EventBooking[]>({
    queryKey: ["/api/admin/event-bookings"],
    queryFn: () => apiRequest("GET", "/api/admin/event-bookings"),
  });

  // Update booking status
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/event-bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-bookings"] });
      toast({ title: "Statut de la réservation mis à jour" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.eventName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline"
    } as const;
    
    const labels = {
      pending: "En attente",
      confirmed: "Confirmée",
      cancelled: "Annulée", 
      completed: "Terminée"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getTotalRevenue = () => {
    const total = filteredBookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, booking) => sum + (parseFloat(String(booking.totalEstimate || '0'))), 0);
    return Number(total) || 0;
  };

  const getTotalGuests = () => {
    return filteredBookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, booking) => sum + (parseInt(String(booking.numberOfGuests || 0))), 0);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Réservations</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Confirmés</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalRevenue().toFixed(2)} CAD</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invités Confirmés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalGuests()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations d'Événements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune réservation trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Événement</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invités</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.eventName || `Événement #${booking.eventId}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(new Date(booking.eventDate), 'dd/MM/yyyy', { locale: fr })}</div>
                        {booking.eventTime && (
                          <div className="text-sm text-muted-foreground">{booking.eventTime}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{booking.numberOfGuests}</TableCell>
                    <TableCell>
                      {booking.totalEstimate && parseFloat(String(booking.totalEstimate)) > 0 ? `$${parseFloat(String(booking.totalEstimate)).toFixed(2)} CAD` : 'Gratuit'}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la Réservation</DialogTitle>
                              <DialogDescription>
                                Réservation #{selectedBooking?.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-semibold mb-2">Informations Client</h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        {selectedBooking.customerName}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {selectedBooking.customerEmail}
                                      </div>
                                      {selectedBooking.customerPhone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          {selectedBooking.customerPhone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Détails Événement</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Événement: {selectedBooking.eventName}</div>
                                      <div>Date: {format(new Date(selectedBooking.eventDate), 'dd/MM/yyyy', { locale: fr })}</div>
                                      {selectedBooking.eventTime && <div>Heure: {selectedBooking.eventTime}</div>}
                                      <div>Nombre d'invités: {selectedBooking.numberOfGuests}</div>
                                      <div>Montant: {selectedBooking.totalEstimate && parseFloat(String(selectedBooking.totalEstimate)) > 0 ? `$${parseFloat(String(selectedBooking.totalEstimate)).toFixed(2)} CAD` : 'Gratuit'}</div>
                                    </div>
                                  </div>
                                </div>

                                {selectedBooking.specialRequests && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Demandes Spéciales</h4>
                                    <p className="text-sm bg-muted p-3 rounded">{selectedBooking.specialRequests}</p>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => updateBookingMutation.mutate({ 
                                      id: selectedBooking.id, 
                                      status: 'confirmed' 
                                    })}
                                    disabled={selectedBooking.status === 'confirmed'}
                                  >
                                    Confirmer
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => updateBookingMutation.mutate({ 
                                      id: selectedBooking.id, 
                                      status: 'cancelled' 
                                    })}
                                    disabled={selectedBooking.status === 'cancelled'}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateBookingMutation.mutate({ 
                                      id: selectedBooking.id, 
                                      status: 'completed' 
                                    })}
                                    disabled={selectedBooking.status === 'completed'}
                                  >
                                    Marquer terminé
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}