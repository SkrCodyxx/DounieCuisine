import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  ChefHat,
  Search,
  Filter,
  Star
} from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";
import type { Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Cache long pour événements - changent occasionnellement
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: false,
  });

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    return events.filter(event => {
      const matchesSearch = searchQuery === "" || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, categoryFilter]);

  // Séparer les événements à venir et passés
  const now = new Date();
  const upcomingEvents = filteredEvents.filter(e => 
    e.activityDate && new Date(e.activityDate) >= now
  ).sort((a, b) => 
    new Date(a.activityDate!).getTime() - new Date(b.activityDate!).getTime()
  );

  const pastEvents = filteredEvents.filter(e => 
    e.activityDate && new Date(e.activityDate) < now
  ).sort((a, b) => 
    new Date(b.activityDate!).getTime() - new Date(a.activityDate!).getTime()
  );

  // Catégories uniques
  const categories = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    const cats = Array.from(new Set(events.map(e => e.category).filter(Boolean))) as string[];
    return cats;
  }, [events]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "";
    return timeStr;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <TopInfoBar />
        <Navigation />
        <div className="pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold mb-2">Chargement des événements</h2>
            <p className="text-muted-foreground">Découvrez nos célébrations à venir...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Motifs décoratifs en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-200/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-amber-200/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2.5s'}}></div>
      </div>
      
      {/* Motifs géométriques calendrier */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ea580c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}></div>
      
      <div className="relative z-10">
        <TopInfoBar />
        <Navigation />

        {/* Hero Section - connexion parfaite TopInfoBar > Navigation > Hero */}
        <section className="pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 pb-12 bg-gradient-to-br from-primary/10 via-orange-50 to-amber-50 relative overflow-hidden">
          {/* Motifs décoratifs dans le hero */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-10 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 animate-fadeIn">
            <div className="flex items-center justify-center mb-6 md:mb-8 lg:mb-12 mt-8 md:mt-12 lg:mt-16">
              <div className="w-24 h-24 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative overflow-hidden group hover:scale-110 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <Calendar className="w-12 h-12 md:w-24 md:h-24 lg:w-28 lg:h-28 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent font-serif">
              Événements & Célébrations
            </h1>
            <p className="text-sm md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              Rejoignez-nous pour des moments inoubliables de culture, gastronomie et convivialité
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="bg-white/95 backdrop-blur-md border-orange-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden">
              {/* Accent décoratif */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un événement..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={categoryFilter === "all" ? "default" : "outline"}
                      onClick={() => setCategoryFilter("all")}
                      size="sm"
                      className={categoryFilter === "all" ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg" : "hover:bg-orange-50 hover:border-orange-300"}
                    >
                      Tous
                    </Button>
                    {categories.map(cat => (
                      <Button
                        key={cat}
                        variant={categoryFilter === cat ? "default" : "outline"}
                        onClick={() => setCategoryFilter(cat)}
                        size="sm"
                        className={categoryFilter === cat ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg" : "hover:bg-orange-50 hover:border-orange-300"}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

        {/* Upcoming Events */}
        <section className="py-16 relative">
          {/* Motifs décoratifs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Événements à Venir</h2>
            <p className="text-muted-foreground">Ne manquez pas nos prochaines célébrations</p>
          </div>

          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">Aucun événement à venir pour le moment</p>
                <p className="text-sm text-muted-foreground mt-2">Revenez bientôt pour découvrir nos prochaines célébrations!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-white/95 backdrop-blur-sm border-orange-100/50 animate-fadeIn relative group">
                  {/* Accent décoratif */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                  {event.imageId && (
                    <div className="relative h-48 overflow-hidden">
                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                      <img
                        src={getImageUrl(event)!}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {event.featured && (
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 shadow-lg z-20 animate-bounce">
                          <Star className="h-3 w-3 mr-1" />
                          Vedette
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                    </div>
                    {event.category && (
                      <Badge variant="secondary" className="w-fit">
                        {event.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {event.activityDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="capitalize">{formatDate(event.activityDate.toString())}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.maxParticipants && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Capacité: {event.maxParticipants} personnes</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t mt-3">
                      {event.price && parseFloat(event.price) > 0 ? (
                        <div className="text-lg font-bold text-primary">
                          ${parseFloat(event.price).toFixed(2)} CAD
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Gratuit
                        </Badge>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Show full details modal
                            toast({
                              title: event.title,
                              description: event.description || "Détails de l'événement",
                            });
                          }}
                        >
                          Détails
                        </Button>
                        {event.requiresReservation && (
                          <Button size="sm">
                            Réserver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="py-16 bg-gradient-to-br from-gray-50 via-orange-50/20 to-gray-50 relative overflow-hidden">
            {/* Motifs décoratifs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gray-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Événements Passés</h2>
              <p className="text-muted-foreground">Revivez nos célébrations précédentes</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-[1.02] bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-xl animate-fadeIn">
                  {event.imageId && (
                    <div className="relative h-48 overflow-hidden grayscale">
                      <img
                        src={getImageUrl(event)!}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    {event.category && (
                      <Badge variant="secondary" className="w-fit">
                        {event.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {event.description && (
                      <CardDescription className="line-clamp-2 text-sm">
                        {event.description}
                      </CardDescription>
                    )}
                    
                    {event.activityDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="capitalize">{formatDate(event.activityDate.toString())}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
