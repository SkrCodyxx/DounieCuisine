import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Star, CalendarCheck } from "lucide-react";
import EventsAdmin from "@/components/admin/EventsAdmin";
import TestimonialsAdmin from "@/components/admin/TestimonialsAdmin";
import EventReservationsAdmin from "@/components/admin/EventReservationsAdmin";

export default function CommunityManagement() {
  const [activeTab, setActiveTab] = useState("events");

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion Communauté</h1>
            <p className="text-muted-foreground">
              Gérez vos événements et témoignages
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              Réservations
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Témoignages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Gestion des Événements
                </CardTitle>
                <CardDescription>
                  Créez et gérez les événements de votre restaurant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Gestion des Réservations d'Événements
                </CardTitle>
                <CardDescription>
                  Gérez les réservations et billets confirmés pour vos événements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventReservationsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Témoignages Clients
                </CardTitle>
                <CardDescription>
                  Modérez et approuvez les avis de vos clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestimonialsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Messages retiré */}


        </Tabs>
      </div>
    </AdminLayout>
  );
}