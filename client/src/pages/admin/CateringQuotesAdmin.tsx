import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Mail, Phone, MapPin, Calendar, Users, DollarSign, Clock, Trash2 } from "lucide-react";

interface CateringQuote {
  id: number;
  eventType: string;
  guestCount: number;
  eventDate: string | null;
  eventTime: string | null;
  location: string | null;
  budgetRange: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string | null;
  selectedItems: any[] | null;
  estimatedPrice: string | null;
  status: "pending" | "reviewed" | "quoted" | "confirmed" | "cancelled";
  adminNotes: string | null;
  quoteSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  reviewed: { label: "Examiné", color: "bg-blue-100 text-blue-800" },
  quoted: { label: "Devis envoyé", color: "bg-purple-100 text-purple-800" },
  confirmed: { label: "Confirmé", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-800" },
};

export default function CateringQuotesAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<CateringQuote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch quotes
  const { data: quotes = [], isLoading } = useQuery<CateringQuote[]>({
    queryKey: ["catering-quotes", statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/admin/catering-quotes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch quotes');
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - devis changent fréquemment
    gcTime: 15 * 60 * 1000, // 15 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Update quote mutation
  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/admin/catering-quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update quote");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-quotes"] });
      toast({ title: "Devis mis à jour avec succès" });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le devis",
        variant: "destructive",
      });
    },
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/catering-quotes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quote");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catering-quotes"] });
      toast({ title: "Devis supprimé avec succès" });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le devis",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (quote: CateringQuote) => {
    setSelectedQuote(quote);
    setEditingStatus(quote.status);
    setAdminNotes(quote.adminNotes || "");
    setDetailsOpen(true);
  };

  const handleUpdateQuote = () => {
    if (!selectedQuote) return;

    const updates: any = {};
    if (editingStatus !== selectedQuote.status) {
      updates.status = editingStatus;
      if (editingStatus === "quoted") {
        updates.quoteSentAt = new Date().toISOString();
      }
    }
    if (adminNotes !== selectedQuote.adminNotes) {
      updates.adminNotes = adminNotes;
    }

    if (Object.keys(updates).length > 0) {
      updateQuoteMutation.mutate({ id: selectedQuote.id, data: updates });
    } else {
      setDetailsOpen(false);
    }
  };

  const handleDeleteQuote = () => {
    if (!selectedQuote) return;
    if (confirm(`Confirmer la suppression du devis #${selectedQuote.id} ?`)) {
      deleteQuoteMutation.mutate(selectedQuote.id);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString("fr-CA");
  };

  const formatPrice = (price: string | null) => {
    if (!price) return "—";
    return `${parseFloat(price).toFixed(2)} $ CAD`;
  };

  const pendingCount = quotes.filter(q => q.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Demandes de Devis Traiteur</h1>
            <p className="text-gray-600 mt-1">
              Gérez les demandes de devis pour vos services de traiteur
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white text-lg px-4 py-2">
              {pendingCount} nouvelle{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="reviewed">Examiné</SelectItem>
                <SelectItem value="quoted">Devis envoyé</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            Aucune demande de devis trouvée
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type d'événement</TableHead>
                <TableHead>Convives</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçu le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono">#{quote.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{quote.customerName}</div>
                    <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                  </TableCell>
                  <TableCell className="capitalize">{quote.eventType}</TableCell>
                  <TableCell>{quote.guestCount}</TableCell>
                  <TableCell>{formatDate(quote.eventDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusLabels[quote.status].color}>
                      {statusLabels[quote.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(quote.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(quote)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Details Dialog */}
      {selectedQuote && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Demande de Devis #{selectedQuote.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-lg mb-4">Informations Client</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Nom</div>
                        <div className="font-medium">{selectedQuote.customerName}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">{selectedQuote.customerEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Téléphone</div>
                        <div className="font-medium">{selectedQuote.customerPhone}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Demande reçue</div>
                        <div className="font-medium">{formatDate(selectedQuote.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Info */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-lg mb-4">Détails de l'Événement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Type d'événement</div>
                      <div className="font-medium capitalize">{selectedQuote.eventType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Nombre de convives</div>
                      <div className="font-medium">{selectedQuote.guestCount} personnes</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Date</div>
                        <div className="font-medium">{formatDate(selectedQuote.eventDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Heure</div>
                        <div className="font-medium">{selectedQuote.eventTime || "Non spécifiée"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Lieu</div>
                        <div className="font-medium">{selectedQuote.location || "Non spécifié"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Budget</div>
                        <div className="font-medium">{selectedQuote.budgetRange || "Non spécifié"}</div>
                      </div>
                    </div>
                  </div>

                  {selectedQuote.message && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mb-2">Message du client</div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        {selectedQuote.message}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Items */}
              {selectedQuote.selectedItems && selectedQuote.selectedItems.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-4">Articles Sélectionnés</h3>
                    <div className="space-y-2">
                      {selectedQuote.selectedItems.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">Quantité: {item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Section */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Gestion Admin</h3>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Statut</label>
                    <Select value={editingStatus} onValueChange={setEditingStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="reviewed">Examiné</SelectItem>
                        <SelectItem value="quoted">Devis envoyé</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes administrateur</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ajoutez des notes internes sur cette demande..."
                      rows={4}
                    />
                  </div>

                  {selectedQuote.quoteSentAt && (
                    <div className="text-sm text-gray-600">
                      Devis envoyé le: {formatDate(selectedQuote.quoteSentAt)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDeleteQuote}
                  disabled={deleteQuoteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpdateQuote}
                    disabled={updateQuoteMutation.isPending}
                  >
                    Enregistrer les modifications
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </AdminLayout>
  );
}
