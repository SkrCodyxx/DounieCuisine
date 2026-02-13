import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import RealtimeDashboard from "@/components/RealtimeDashboard";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  UtensilsCrossed,
  Calendar,
  Mail,
  Ticket,
  Users,
} from "lucide-react";

export default function Dashboard() {
  // Lightweight widgets: events & bookings
  const { data: events } = useQuery<any[]>({
    queryKey: ["/api/admin/events"],
    queryFn: () => apiRequest("GET", "/api/admin/events"),
    staleTime: 5 * 60 * 1000, // 5 minutes - événements admin
    gcTime: 20 * 60 * 1000, // 20 minutes en cache
    refetchOnWindowFocus: false,
  });
  const { data: bookings } = useQuery<any[]>({
    queryKey: ["/api/admin/event-bookings"],
    queryFn: () => apiRequest("GET", "/api/admin/event-bookings"),
    staleTime: 2 * 60 * 1000, // 2 minutes - réservations fréquentes
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    refetchOnWindowFocus: false,
  });

  const upcomingCount = (events || []).filter((e) => {
    const isPublished = e.isPublished !== false; // default true
    const isUpcomingStatus = e.status === "upcoming";
    const futureDate = e.activityDate ? new Date(e.activityDate) > new Date() : false;
    return isPublished && (isUpcomingStatus || futureDate);
  }).length;

  const recentBookings = (bookings || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const confirmed = (bookings || []).filter((b) => b.status === "confirmed");
  const totalEstimate = confirmed.reduce((sum: number, b: any) => {
    const n = typeof b.totalEstimate === "string" ? parseFloat(b.totalEstimate) : Number(b.totalEstimate);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Main Real-time Dashboard */}
        <RealtimeDashboard />

        {/* Lightweight Event/Booking Widgets */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Événements à venir</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Basé sur la date ou le statut</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billets confirmés</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmed.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Estimation: {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(totalEstimate)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations récentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucune réservation récente</div>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <div className="truncate">
                        <span className="font-medium">{b.customerName || "Client"}</span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-muted-foreground truncate">
                          {b.event?.title || "Événement personnalisé"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString("fr-CA", { month: "2-digit", day: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/admin/takeout-menu">
                <Button className="w-full" variant="outline" data-testid="button-quick-add-dish">
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                  Gérer le menu à emporter
                </Button>
              </Link>
              <Link href="/admin/events">
                <Button className="w-full" variant="outline" data-testid="button-quick-add-event">
                  <Calendar className="mr-2 h-4 w-4" />
                  Créer un événement
                </Button>
              </Link>
              <Link href="/admin/messages-unified">
                <Button className="w-full" variant="outline" data-testid="button-quick-view-messages">
                  <Mail className="mr-2 h-4 w-4" />
                  Voir les messages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
