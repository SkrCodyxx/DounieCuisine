import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { forceRefreshCache } from "@/lib/cacheUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface DeliveryZone {
  id: number;
  zoneName: string;
  distanceMinKm: string;
  distanceMaxKm: string;
  deliveryPrice: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

const deliveryZoneSchema = z.object({
  zoneName: z.string().min(1, "Nom de la zone requis").max(100),
  distanceMinKm: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Distance minimale doit être un nombre >= 0"
  }),
  distanceMaxKm: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Distance maximale doit être un nombre > 0"
  }),
  deliveryPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Prix doit être un nombre >= 0"
  }),
  isActive: z.number().optional().default(1),
}).refine((data) => parseFloat(data.distanceMaxKm) > parseFloat(data.distanceMinKm), {
  message: "Distance max doit être supérieure à distance min",
  path: ["distanceMaxKm"],
});

type DeliveryZoneFormData = z.infer<typeof deliveryZoneSchema>;

export default function DeliveryZones() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const { data: zones = [], isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/admin/delivery-zones"],
  });

  const form = useForm<DeliveryZoneFormData>({
    resolver: zodResolver(deliveryZoneSchema),
    defaultValues: {
      zoneName: "",
      distanceMinKm: "0",
      distanceMaxKm: "10",
      deliveryPrice: "5.00",
      isActive: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DeliveryZoneFormData) =>
      apiRequest("POST", "/api/admin/delivery-zones", data),
    onSuccess: () => {
      forceRefreshCache("/api/admin/delivery-zones");
      toast({
        title: "Succès",
        description: "Zone de livraison créée avec succès",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de création de la zone",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DeliveryZoneFormData> }) =>
      apiRequest("PUT", `/api/admin/delivery-zones/${id}`, data),
    onSuccess: () => {
      forceRefreshCache("/api/admin/delivery-zones");
      toast({
        title: "Succès",
        description: "Zone de livraison mise à jour avec succès",
      });
      setIsDialogOpen(false);
      setEditingZone(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de mise à jour de la zone",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/delivery-zones/${id}`),
    onSuccess: () => {
      forceRefreshCache("/api/admin/delivery-zones");
      toast({
        title: "Succès",
        description: "Zone de livraison supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de suppression de la zone",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DeliveryZoneFormData) => {
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    form.reset({
      zoneName: zone.zoneName,
      distanceMinKm: zone.distanceMinKm,
      distanceMaxKm: zone.distanceMaxKm,
      deliveryPrice: zone.deliveryPrice,
      isActive: zone.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette zone de livraison?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingZone(null);
    form.reset();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Zones de Livraison</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les zones et les prix de livraison selon la distance
            </p>
          </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()} data-testid="button-create-zone">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Modifier la Zone" : "Nouvelle Zone de Livraison"}
              </DialogTitle>
              <DialogDescription>
                Configurez le nom, la distance et le prix de livraison pour cette zone
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="zoneName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la Zone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Zone Centre-ville"
                          data-testid="input-zone-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="distanceMinKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance Min (km)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            data-testid="input-distance-min"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="distanceMaxKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance Max (km)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0.01"
                            data-testid="input-distance-max"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="deliveryPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de Livraison (CAD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          data-testid="input-delivery-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Zone Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value === 1}
                          onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                          data-testid="switch-zone-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    data-testid="button-cancel"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-zone"
                  >
                    {editingZone ? "Mettre à Jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Zones Configurées
          </CardTitle>
          <CardDescription>
            {zones.length} zone(s) de livraison configurée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : zones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune zone de livraison configurée</p>
              <p className="text-sm mt-2">Créez votre première zone pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la Zone</TableHead>
                  <TableHead>Distance Min (km)</TableHead>
                  <TableHead>Distance Max (km)</TableHead>
                  <TableHead>Prix (CAD)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id} data-testid={`zone-row-${zone.id}`}>
                    <TableCell className="font-medium">{zone.zoneName}</TableCell>
                    <TableCell>{parseFloat(zone.distanceMinKm).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(zone.distanceMaxKm).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(zone.deliveryPrice).toFixed(2)} CAD</TableCell>
                    <TableCell>
                      {zone.isActive === 1 ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(zone)}
                          data-testid={`button-edit-${zone.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(zone.id)}
                          data-testid={`button-delete-${zone.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
    </AdminLayout>
  );
}
