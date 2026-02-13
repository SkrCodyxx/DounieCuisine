import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import EventCard from "@/components/EventCard";
import TestimonialCard from "@/components/TestimonialCard";
import EnhancedGalleryGrid from "@/components/EnhancedGalleryGrid";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, Music, Calendar } from "lucide-react";
import { useSiteInfo } from "@/hooks/useSiteInfo";
import type { Event, Testimonial, Gallery } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/image-utils";

export default function Home() {
  const { toast } = useToast();

  // Utilisation des hooks centralisés avec cache optimisé
  const { data: siteInfo } = useSiteInfo();
  
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    staleTime: 30 * 60 * 1000, // 30 minutes - événements changent occasionnellement
    gcTime: 60 * 60 * 1000, // 1 heure en cache
    refetchOnWindowFocus: false,
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    staleTime: 2 * 60 * 60 * 1000, // 2 heures - témoignages changent très rarement
    gcTime: 4 * 60 * 60 * 1000, // 4 heures en cache
    refetchOnWindowFocus: false,
  });

  const { data: gallery = [], isLoading: galleryLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
    staleTime: 45 * 60 * 1000, // 45 minutes - galerie modifiée occasionnellement
    gcTime: 90 * 60 * 1000, // 1h30 en cache
    refetchOnWindowFocus: false,
  });

  const upcomingEvents = events?.slice(0, 3) || [];
  const approvedTestimonials = testimonials?.slice(0, 3) || [];
  
  // Afficher les images mises en avant (featured), sinon les 8 premières images
  const featuredGallery = Array.isArray(gallery) ? gallery.filter((g) => g.featured === 1) : [];
  const displayGallery = featuredGallery.length > 0 
    ? featuredGallery.slice(0, 8)
    : (Array.isArray(gallery) ? gallery.slice(0, 8) : []);

  const galleryImages = displayGallery.map((item: any) => ({
    mediaId: item.media_id || item.mediaId,
    media_id: item.media_id || item.mediaId,
    title: item.title || "",
    category: item.category || "",
  }));

  // Calculer le timestamp de dernière mise à jour pour forcer le rechargement des images
  const lastUpdate = gallery?.reduce((latest, item) => {
    const itemTime = new Date(item.createdAt).getTime();
    return Math.max(latest, itemTime);
  }, 0) || Date.now();

  const handleContactSubmit = async (data: any) => {
    try {
      await apiRequest("POST", "/api/contact", {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        inquiryType: data.inquiryType,
        subject: data.subject || null,
        message: data.message,
      });

      toast({
        title: "Message envoyé!",
        description: "Nous vous répondrons bientôt.",
      });
      // Succès - le formulaire sera réinitialisé
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
      throw error; // Propager l'erreur pour empêcher la réinitialisation
    }
  };

  return (
    <div className="min-h-screen">
      <TopInfoBar />
      <Navigation />

      <section id="home">
        <Hero
          onOrderClick={() => (window.location.href = "/menu")}
          onMenuClick={() => (window.location.href = "/catering")}
        />
      </section>

      <section id="services" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Nos Services"
            subtitle="Tout ce dont vous avez besoin pour un événement réussi"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <ServiceCard
              icon={UtensilsCrossed}
              title="Service Traiteur"
              description="Saveurs authentiques pour vos événements privés et corporatifs"
              onLearnMore={() => (window.location.href = "/catering")}
            />
            <ServiceCard
              icon={Calendar}
              title="Organisation d'Événements"
              description="Planification complète pour des événements inoubliables"
              onLearnMore={() => (window.location.href = "/events")}
            />
            <ServiceCard
              icon={Music}
              title="DJ & Animation"
              description="Musique et animation professionnelle pour créer l'ambiance parfaite"
              onLearnMore={() => (window.location.href = "/events")}
            />
          </div>
        </div>
      </section>

      <section id="events" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Événements à Venir"
            subtitle="Rejoignez-nous pour des célébrations inoubliables"
          />
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" data-testid={`skeleton-event-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  description={event.description || ""}
                  date={(event.activityDate ? new Date(event.activityDate) : new Date()).toLocaleDateString("fr-CA")}
                  time={undefined}
                  location={event.location || ""}
                  price={parseFloat(event.price || "0")}
                  image={getImageUrl(event) || ""}
                  category={event.category || ""}
                  maxGuests={event.maxParticipants || undefined}
                  currentBookings={event.currentReservations || undefined}
                />
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link href="/events">
              <Button variant="outline" size="lg" data-testid="button-view-all-events">
                Tous les Événements
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Témoignages"
            subtitle="Ce que nos clients disent de nous"
          />
          {testimonialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" data-testid={`skeleton-testimonial-${i}`} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                {approvedTestimonials.map((testimonial: any) => (
                  <TestimonialCard
                    key={testimonial.id}
                    clientName={testimonial.client_name || testimonial.clientName}
                    clientPhoto={testimonial.client_photo_id || testimonial.clientPhotoId ? `/api/media/${testimonial.client_photo_id || testimonial.clientPhotoId}` : undefined}
                    rating={testimonial.rating}
                    comment={testimonial.comment}
                    eventType={testimonial.event_type || testimonial.eventType || undefined}
                  />
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Laisser un avis
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section id="gallery" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Galerie"
            subtitle="Découvrez nos créations et événements en images"
          />
          {galleryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" data-testid={`skeleton-gallery-${i}`} />
              ))}
            </div>
          ) : (
            <div className="mt-12">
                            <EnhancedGalleryGrid 
                images={galleryImages} 
                lastUpdate={Date.now()}
              />
            </div>
          )}
          <div className="text-center mt-12">
            <Link href="/gallery">
              <Button variant="outline" size="lg" data-testid="button-view-full-gallery">
                Voir Toute la Galerie
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Contactez-nous"
            subtitle="Nous sommes là pour répondre à toutes vos questions"
          />
          <div className="mt-12">
            <ContactForm onSubmit={handleContactSubmit} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
