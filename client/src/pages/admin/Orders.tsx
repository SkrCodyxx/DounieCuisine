import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
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
import { Eye, FileDown, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import type { Order, OrderItem, Dish, SiteInfo } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export";
import { forceRefreshCache } from "@/lib/cacheUtils";

interface OrderWithItems extends Omit<Order, 'customerName' | 'customerPhone' | 'customerEmail'> {
  items?: (OrderItem & { dishName?: string })[];
  customerName?: string;
  customerEmail?: string; 
  customerPhone?: string | null;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    apartment?: string;
    city?: string;
    postalCode?: string;
  };
}

export default function Orders() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewingOrder, setViewingOrder] = useState<OrderWithItems | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);

  // Real-time updates for orders
  const { isConnected } = useRealtimeEvents({
    onEvent: (event) => {
      if (event.type === 'new_order') {
        toast({
          title: "Nouvelle commande",
          description: `Commande #${event.data?.orderNumber || ''} de ${event.data?.customerName || 'un client'}`,
        });
        setLastEvent(event);
      } else if (event.type === 'order_updated') {
        toast({
          title: "Commande mise à jour",
          description: `Statut de la commande #${event.data?.orderNumber || ''} modifié`,
        });
        setLastEvent(event);
      }
    }
  });

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: () => apiRequest("GET", "/api/admin/orders"),
    staleTime: 2 * 60 * 1000, // 2 minutes - données admin fréquentes
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    refetchOnWindowFocus: false,
  });

  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery<OrderWithItems>({
    queryKey: ["/api/admin/orders", viewingOrder?.id],
    queryFn: () => apiRequest("GET", `/api/admin/orders/${viewingOrder?.id}`),
    enabled: !!viewingOrder?.id && isDetailsOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes - détails commande
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: siteInfo } = useQuery<SiteInfo>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings"),
    staleTime: 15 * 60 * 1000, // 15 minutes - paramètres admin
    gcTime: 60 * 60 * 1000, // 1h en cache
    refetchOnWindowFocus: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      forceRefreshCache("/api/admin/orders");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Échec de la mise à jour du statut",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/orders/${id}`),
    onSuccess: () => {
      forceRefreshCache("/api/admin/orders");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Échec de la suppression de la commande",
        variant: "destructive",
      });
    },
  });

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    return statusFilter === "all" || order.status === statusFilter;
  });

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      completed: "Terminée",
      cancelled: "Annulée",
    };
    return labels[status] || status;
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete.id);
    }
  };

  const handleExportPDF = () => {
    if (!filteredOrders) return;
    
    exportToPDF({
      title: "Rapport des Commandes",
      fileName: `commandes-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "DC-ID", field: "dcId", width: 15 },
        { header: "Client", field: "customerName", width: 20 },
        { header: "Email", field: "customerEmail", width: 25 },
        { header: "Date", field: "orderDate", width: 15 },
        { header: "Total", field: "totalAmount", width: 12 },
        { header: "Statut", field: "status", width: 12 },
      ],
      data: filteredOrders.map(order => ({
        ...order,
        orderDate: format(new Date(order.createdAt), "MMM dd, yyyy"),
        totalAmount: `${Number(order.totalAmount).toFixed(2)} CAD`,
      })),
      companyInfo: {
        name: siteInfo?.businessName || "Dounie Cuisine",
        address: siteInfo?.address ? `${siteInfo.address}, ${siteInfo.city}, ${siteInfo.province}${siteInfo.postalCode ? ` ${siteInfo.postalCode}` : ''}` : "Montreal, QC, Canada",
        phone: siteInfo?.phone1 || "(514) XXX-XXXX",
        email: siteInfo?.emailPrimary || "contact@douniecuisine.com",
      },
    });
    
    toast({
      title: "Succès",
      description: "PDF exporté avec succès",
    });
  };

  const handleExportExcel = () => {
    if (!filteredOrders) return;
    
    exportToExcel({
      title: "Rapport des Commandes",
      fileName: `commandes-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "DC-ID", field: "dcId", width: 15 },
        { header: "ID Client", field: "customerId", width: 12 },
        { header: "DC-ID Client", field: "customerDcId", width: 15 },
        { header: "Nom Client", field: "customerName", width: 20 },
        { header: "Email", field: "customerEmail", width: 25 },
        { header: "Téléphone", field: "customerPhone", width: 15 },
        { header: "Date Commande", field: "orderDate", width: 15 },
        { header: "Date Livraison", field: "deliveryDate", width: 15 },
        { header: "Montant Total", field: "totalAmount", width: 12 },
        { header: "Statut", field: "status", width: 12 },
        { header: "Mode de Paiement", field: "paymentMethod", width: 15 },
        { header: "Notes", field: "specialInstructions", width: 30 },
      ],
      data: filteredOrders.map(order => ({
        ...order,
        orderDate: format(new Date(order.createdAt), "MMM dd, yyyy"),
        deliveryDate: order.deliveryDate ? format(new Date(order.deliveryDate), "MMM dd, yyyy") : "N/A",
        totalAmount: Number(order.totalAmount).toFixed(2),
      })),
      companyInfo: {
        name: siteInfo?.businessName || "Dounie Cuisine",
        email: siteInfo?.emailPrimary || "contact@douniecuisine.com",
      },
    });
    
    toast({
      title: "Succès",
      description: "Fichier Excel exporté avec succès",
    });
  };

  const handleExportCSV = () => {
    if (!filteredOrders) return;
    
    exportToCSV({
      title: "Rapport des Commandes",
      fileName: `commandes-${format(new Date(), "yyyy-MM-dd")}`,
      columns: [
        { header: "DC-ID", field: "dcId" },
        { header: "Nom Client", field: "customerName" },
        { header: "Email", field: "customerEmail" },
        { header: "Téléphone", field: "customerPhone" },
        { header: "Date Commande", field: "orderDate" },
        { header: "Date Livraison", field: "deliveryDate" },
        { header: "Montant Total", field: "totalAmount" },
        { header: "Statut", field: "status" },
        { header: "Mode de Paiement", field: "paymentMethod" },
        { header: "Notes", field: "specialInstructions" },
      ],
      data: filteredOrders.map(order => ({
        ...order,
        orderDate: format(new Date(order.createdAt), "MMM dd, yyyy"),
        deliveryDate: order.deliveryDate ? format(new Date(order.deliveryDate), "MMM dd, yyyy") : "N/A",
        totalAmount: Number(order.totalAmount).toFixed(2),
      })),
    });
    
    toast({
      title: "Succès",
      description: "Fichier CSV exporté avec succès",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-orders-title">
              Commandes
            </h1>
            <p className="text-muted-foreground" data-testid="text-orders-subtitle">
              Gérer les commandes clients
            </p>
          </div>
          
          
            
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={!filteredOrders || filteredOrders.length === 0}
              data-testid="button-export-pdf"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={!filteredOrders || filteredOrders.length === 0}
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!filteredOrders || filteredOrders.length === 0}
              data-testid="button-export-csv"
            >
              <FileDown className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="completed">Terminée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
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
                  <TableHead>Commande #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.customerEmail}</TableCell>
                      <TableCell data-testid={`text-order-total-${order.id}`}>
                        {order.totalAmount} CAD
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(order.id, value)
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger
                            className="w-36"
                            data-testid={`select-order-status-${order.id}`}
                          >
                            <SelectValue>
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order)}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deleteOrderMutation.isPending}
                            data-testid={`button-delete-order-${order.id}`}
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
                      data-testid="text-no-orders"
                    >
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la commande <strong>{orderToDelete?.orderNumber}</strong> de <strong>{orderToDelete?.customerName}</strong> ?
                <br /><br />
                Cette action est irréversible et supprimera également tous les éléments associés à cette commande.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteOrderMutation.isPending}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteOrderMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteOrderMutation.isPending ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-order-details">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                Détails de la commande - {viewingOrder?.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Client : {viewingOrder?.customerName}
              </DialogDescription>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Informations client</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nom :</span>{" "}
                      {orderDetails.customerName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email :</span>{" "}
                      {orderDetails.customerEmail}
                    </div>
                    {orderDetails.customerPhone && (
                      <div>
                        <span className="text-muted-foreground">Téléphone :</span>{" "}
                        {orderDetails.customerPhone}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Type de commande :</span>{" "}
                      {orderDetails.orderType === 'delivery' ? 'Livraison' : orderDetails.orderType === 'pickup' ? 'À emporter' : orderDetails.orderType}
                    </div>
                    {orderDetails.customer?.address && (
                      <>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Adresse client:</span>{" "}
                          {orderDetails.customer.address}
                          {orderDetails.customer.apartment && `, Apt: ${orderDetails.customer.apartment}`}
                          <br />
                          {orderDetails.customer.city}, {orderDetails.customer.postalCode}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                {orderDetails.orderType === 'delivery' && (orderDetails.deliveryAddress || orderDetails.deliveryApartment) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Adresse de livraison</h3>
                    <div className="p-3 border rounded-md bg-muted/20">
                      <div className="text-sm">
                        {orderDetails.deliveryAddress && (
                          <div>{orderDetails.deliveryAddress}</div>
                        )}
                        {orderDetails.deliveryApartment && (
                          <div className="text-muted-foreground">
                            Appartement: {orderDetails.deliveryApartment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Articles de la commande</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plat</TableHead>
                          <TableHead>Quantité</TableHead>
                          <TableHead>Prix unitaire</TableHead>
                          <TableHead>Sous-total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetails.items?.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell data-testid={`text-item-name-${index}`}>
                              {item.dishName || `Dish #${item.dishId}`}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unitPrice} CAD</TableCell>
                            <TableCell>
                              {(
                                parseFloat(item.unitPrice) * item.quantity
                              ).toFixed(2)} CAD
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Résumé de la commande</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total :</span>
                      <span>{orderDetails.totalAmount} CAD</span>
                    </div>
                    {orderDetails.taxAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes :</span>
                        <span>{orderDetails.taxAmount} CAD</span>
                      </div>
                    )}
                    {orderDetails.deliveryFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frais de livraison :</span>
                        <span>{orderDetails.deliveryFee} CAD</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-base pt-2 border-t">
                      <span>Total :</span>
                      <span data-testid="text-order-total">{orderDetails.totalAmount} CAD</span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {orderDetails.specialInstructions && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Instructions spéciales</h3>
                    <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/20">
                      {orderDetails.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Impossible de charger les détails de la commande
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
