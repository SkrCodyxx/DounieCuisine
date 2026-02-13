import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { forceRefreshCache } from "@/lib/cacheUtils";
import { 
  Eye, 
  Reply, 
  Send, 
  MessageSquare, 
  Mail, 
  CheckCheck,
  Clock,
  Ban,
  CheckCircle,
  FileDown, 
  FileSpreadsheet, 
  FileText,
  Trash,
  Filter
} from "lucide-react";
import type { ContactMessage, SiteInfo } from "@shared/schema";
import { format } from "date-fns";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export";

// Generate consistent color for each admin based on their ID
function getAdminColor(adminId: number | null | undefined): string {
  if (!adminId) return "hsl(var(--muted))";
  
  const colors = [
    "hsl(200, 80%, 45%)", // Blue
    "hsl(280, 70%, 50%)", // Purple
    "hsl(160, 60%, 40%)", // Teal
    "hsl(30, 85%, 50%)",  // Orange
    "hsl(340, 75%, 50%)", // Pink
    "hsl(120, 60%, 40%)", // Green
  ];
  
  return colors[adminId % colors.length];
}

export default function MessagesUnified() {
  const { toast } = useToast();
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>(""); // '', 'new','read','replied'
  const [search, setSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Real-time updates for messages and conversations
  const { isConnected } = useRealtimeEvents({
    onEvent: (event) => {
      if (event.type === 'new_message' || event.type === 'message_deleted') {
        // Show notification for new messages
        if (event.type === 'new_message') {
          toast({
            title: "Nouveau message",
            description: `Message reçu de ${event.data?.customerName || 'un client'}`,
          });
        }
        // Invalider les caches liés aux messages et aux stats
        queryClient.invalidateQueries({ queryKey: ['admin','messages'] });
        queryClient.invalidateQueries({ queryKey: ['admin','messages','stats'] });
        forceRefreshCache("/api/admin/messages");
        setLastEvent(event);
      }
    }
  });

  // Contact Messages (avec filtres)
  const queryParams = useMemo(() => ({
    status: statusFilter || undefined,
    q: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [statusFilter, search, dateFrom, dateTo]);

  // Créer une clé de query stable en sérialisant les params
  const queryKey = useMemo(() => {
    const key = ['admin','messages'];
    // Ajouter seulement les paramètres définis pour éviter les clés instables
    if (queryParams.status) key.push('status', queryParams.status);
    if (queryParams.q) key.push('q', queryParams.q);
    if (queryParams.dateFrom) key.push('dateFrom', queryParams.dateFrom);
    if (queryParams.dateTo) key.push('dateTo', queryParams.dateTo);
    return key;
  }, [queryParams.status, queryParams.q, queryParams.dateFrom, queryParams.dateTo]);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<ContactMessage[]>({
    queryKey: queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryParams.status) params.set('status', queryParams.status);
      if (queryParams.q) params.set('q', queryParams.q);
      if (queryParams.dateFrom) params.set('dateFrom', queryParams.dateFrom);
      if (queryParams.dateTo) params.set('dateTo', queryParams.dateTo);
      const response = await apiRequest('GET', `/api/admin/messages?${params.toString()}`);
      // Notre API retourne { data: messages, pagination: {...} }
      return response.data || response; // Support pour ancien et nouveau format
    },
    staleTime: 1 * 60 * 1000, // 1 minute - messages changent fréquemment
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    refetchOnWindowFocus: false,
  });

  // Stats messages (temps réel + snapshot)
  const { data: messageStats } = useQuery<{ total: number; new: number; open: number }>({
    queryKey: ['admin','messages','stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/messages/stats');
      // Mapping des stats de notre API vers le format attendu
      return {
        total: response.total || 0,
        new: response.unread || 0,
        open: response.today || 0
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats messages
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    refetchOnWindowFocus: false,
  });

  const { data: siteInfo } = useQuery<SiteInfo>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings"),
    staleTime: 15 * 60 * 1000, // 15 minutes - paramètres admin
    gcTime: 60 * 60 * 1000, // 1h en cache
    refetchOnWindowFocus: false,
  });

  // Contact message mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/admin/messages/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin','messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin','messages','stats'] });
      forceRefreshCache("/api/admin/messages");
      toast({
        title: "Succès",
        description: "Statut du message mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du statut",
        variant: "destructive",
      });
    },
  });


  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (payload: { ids?: number[]; all?: boolean }) => {
      const body: any = { ...payload };
      if (payload.all) {
        body.filter = { status: statusFilter || undefined, q: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
      }
      return apiRequest('POST', '/api/admin/messages/bulk-delete', body);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin','messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin','messages','stats'] });
      setSelectedIds([]);
      setSelectAll(false);
      toast({ title: 'Supprimé', description: `${res.deleted || selectedIds.length} message(s) supprimé(s)`});
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Échec de la suppression", variant: 'destructive' });
    }
  });

  // Contact message handlers
  const handleViewMessage = (message: ContactMessage) => {
    setViewingMessage(message);
    setIsDetailsOpen(true);

    if (message.status === "new") {
      updateStatusMutation.mutate({ id: message.id, status: "read" });
    }
  };

  const handleMarkAsReplied = (id: number) => {
    updateStatusMutation.mutate({ id, status: "replied" });
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      new: "default",
      read: "secondary",
      replied: "secondary",
    };
    return variants[status] || "default";
  };

  // Sélection
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll && messages) {
      setSelectedIds(messages.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };
  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Export handlers
  const handleExportPDF = () => {
    if (!messages) return;
    exportToPDF({
      title: "Rapport des Messages",
      fileName: `messages-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [{ header: "Nom", field: "name", width: 25 }, { header: "Email", field: "email", width: 30 }, { header: "Sujet", field: "subject", width: 35 }],
      data: messages,
      companyInfo: { name: siteInfo?.businessName || "Dounie Cuisine" },
    });
    toast({ title: "Succès", description: "PDF exporté" });
  };

  const handleExportExcel = () => {
    if (!messages) return;
    exportToExcel({
      title: "Rapport des Messages",
      fileName: `messages-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [{ header: "ID", field: "id" }, { header: "Nom", field: "name", width: 25 }, { header: "Email", field: "email", width: 30 }, { header: "Statut", field: "status", width: 15 }],
      data: messages,
      companyInfo: { name: siteInfo?.businessName || "Dounie Cuisine" },
    });
    toast({ title: "Succès", description: "Excel exporté" });
  };

  const handleExportCSV = () => {
    if (!messages) return;
    exportToCSV({
      title: "Rapport des Messages",
      fileName: `messages-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [{ header: "Nom", field: "name" }, { header: "Email", field: "email" }, { header: "Statut", field: "status" }],
      data: messages,
    });
    toast({ title: "Succès", description: "CSV exporté" });
  };

  const closedConversations: any[] = [];
  const newMessages = messageStats?.new || (messages?.filter(m => m.status === "new").length || 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate" data-testid="text-messages-title">
              Messagerie
            </h1>
            <p className="text-muted-foreground text-sm" data-testid="text-messages-subtitle">
              Messages de contact clients
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex gap-1 flex-nowrap">
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!messages || messages.length === 0}>
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!messages || messages.length === 0}>
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Excel</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!messages || messages.length === 0}>
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (statusFilter) params.set('status', statusFilter);
                  if (search) params.set('q', search);
                  if (dateFrom) params.set('dateFrom', dateFrom);
                  if (dateTo) params.set('dateTo', dateTo);
                  window.open(`/api/admin/messages/export?format=csv&${params.toString()}`, '_blank');
                }}
                disabled={isLoadingMessages}
                className="whitespace-nowrap"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Export CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Messages</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{newMessages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">Messages ouverts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messageStats?.open ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{messageStats?.total ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">Actions</CardTitle>
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 min-h-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 justify-start truncate"
                  onClick={() => bulkDeleteMutation.mutate({ ids: selectedIds })}
                  disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
                >
                  <Trash className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Supprimer sélection</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 justify-start truncate"
                  onClick={() => bulkDeleteMutation.mutate({ all: true })}
                  disabled={isLoadingMessages || bulkDeleteMutation.isPending || (messages?.length || 0) === 0}
                >
                  <Trash className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Tout supprimer</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Statut</label>
                <select
                  className="border rounded h-9 px-2 text-sm w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tous</option>
                  <option value="new">Nouveau</option>
                  <option value="read">Lu</option>
                  <option value="replied">Répondu</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Recherche</label>
                <Input placeholder="Nom, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Du</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Au</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setStatusFilter(''); setSearch(''); setDateFrom(''); setDateTo(''); }}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des messages */}
        <div className="space-y-4">
            {isLoadingMessages ? (
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
                      <TableHead className="w-10">
                        <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                      </TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages && messages.length > 0 ? (
                      messages.map((message) => (
                        <TableRow key={message.id} data-testid={`row-message-${message.id}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(message.id)}
                              onCheckedChange={() => toggleSelectOne(message.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{message.name}</TableCell>
                          <TableCell>{message.email}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {message.subject || "Pas de sujet"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{message.inquiryType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(message.status || "new")}
                              data-testid={`badge-message-status-${message.id}`}
                            >
                              {message.status === "new" ? "Nouveau" : 
                               message.status === "read" ? "Lu" : 
                               message.status === "replied" ? "Répondu" : message.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(message.createdAt), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-right w-32">
                            <div className="flex justify-end gap-1 min-w-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => handleViewMessage(message)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {message.status !== "replied" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => handleMarkAsReplied(message.id)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucun message trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
        </div>

        {/* Contact Message Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Message de {viewingMessage?.name}
              </DialogTitle>
              <DialogDescription>
                Reçu le{" "}
                {viewingMessage &&
                  format(new Date(viewingMessage.createdAt), "dd MMMM yyyy")}
              </DialogDescription>
            </DialogHeader>
            {viewingMessage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nom:</span>{" "}
                    {viewingMessage.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {viewingMessage.email}
                  </div>
                  {viewingMessage.phone && (
                    <div>
                      <span className="text-muted-foreground">Téléphone:</span>{" "}
                      {viewingMessage.phone}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {viewingMessage.inquiryType}
                  </div>
                </div>

                {viewingMessage.subject && (
                  <div>
                    <h3 className="font-semibold mb-2">Sujet</h3>
                    <p className="text-sm">{viewingMessage.subject}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Message</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {viewingMessage.message}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `mailto:${viewingMessage.email}`)
                    }
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Répondre par Email
                  </Button>
                  {viewingMessage.status !== "replied" && (
                    <Button
                      onClick={() => {
                        handleMarkAsReplied(viewingMessage.id);
                        setIsDetailsOpen(false);
                      }}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marquer comme Répondu
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Impossible de charger les détails du message
              </p>
            )}
          </DialogContent>
        </Dialog>

        {/* Suppression du module Conversations */}
      </div>
    </AdminLayout>
  );
}