"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, Music, Calendar } from "lucide-react";
import { useSiteInfo } from "@/hooks/use-site-info";
import { apiRequest } from "@/lib/query-client";
import { getImageUrl, getClientPhotoUrl } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import type { Event, Testimonial, Gallery } from "@/lib/schema";
import type { GalleryImage } from "@/types";

// Inline sub-components to avoid creating many small files initially
function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-4xl font-serif font-bold text-balance">{title}</h2>
      <p className="mt-4 text-lg text-muted-foreground text-pretty">{subtitle}</p>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, description, href }: { icon: React.ElementType; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group">
      <div className="text-center p-8 rounded-xl border bg-card hover:shadow-lg transition-all">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  const imageUrl = getImageUrl(event);
  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={event.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        {event.activityDate && (
          <p className="text-sm text-primary mt-2 font-medium">
            {new Date(event.activityDate).toLocaleDateString("fr-CA")}
          </p>
        )}
        {event.location && <p className="text-sm text-muted-foreground mt-1">{event.location}</p>}
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const photoUrl = getClientPhotoUrl(testimonial);
  return (
    <div className="p-6 rounded-xl border bg-card">
      <div className="flex items-center gap-3 mb-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={testimonial.clientName} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {testimonial.clientName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold">{testimonial.clientName}</p>
          {testimonial.eventType && <p className="text-sm text-muted-foreground">{testimonial.eventType}</p>}
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < testimonial.rating ? "text-yellow-500" : "text-muted-foreground/30"}>
            {"*"}
          </span>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{testimonial.comment}</p>
    </div>
  );
}

function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((img, i) => (
        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/${img.mediaId}`}
            alt={img.title || "Gallery"}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export default function HomeClient() {
  const { toast } = useToast();
  const { data: siteInfo } = useSiteInfo();

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest<Event[]>("GET", "/api/events"),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    queryFn: () => apiRequest<Testimonial[]>("GET", "/api/testimonials"),
    staleTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: gallery = [], isLoading: galleryLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
    queryFn: () => apiRequest<Gallery[]>("GET", "/api/gallery"),
    staleTime: 45 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const upcomingEvents = events.slice(0, 3);
  const approvedTestimonials = testimonials.slice(0, 3);

  const featuredGallery = gallery.filter((g) => g.featured === 1);
  const displayGallery = (featuredGallery.length > 0 ? featuredGallery : gallery).slice(0, 8);
  const galleryImages: GalleryImage[] = displayGallery.map((item) => ({
    mediaId: item.mediaId,
    title: item.title || "",
    category: item.category || "",
  }));

  const handleContactSubmit = async (data: Record<string, string>) => {
    try {
      await apiRequest("POST", "/api/contact", {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        inquiryType: data.inquiryType || "general",
        subject: data.subject || null,
        message: data.message,
      });
      toast({ title: "Message envoye!", description: "Nous vous repondrons bientot." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur s'est produite.", variant: "destructive" });
    }
  };

  return (
    <PageLayout>
      {/* Services */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Nos Services" subtitle="Tout ce dont vous avez besoin pour un evenement reussi" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <ServiceCard
              icon={UtensilsCrossed}
              title="Service Traiteur"
              description="Saveurs authentiques pour vos evenements prives et corporatifs"
              href="/menu?tab=catering"
            />
            <ServiceCard
              icon={Calendar}
              title="Organisation d'Evenements"
              description="Planification complete pour des evenements inoubliables"
              href="/events"
            />
            <ServiceCard
              icon={Music}
              title="DJ & Animation"
              description="Musique et animation professionnelle pour creer l'ambiance parfaite"
              href="/events"
            />
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Evenements a Venir" subtitle="Rejoignez-nous pour des celebrations inoubliables" />
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link href="/events">
              <Button variant="outline" size="lg">Tous les Evenements</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Temoignages" subtitle="Ce que nos clients disent de nous" />
          {testimonialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {approvedTestimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          )}
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
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Galerie" subtitle="Decouvrez nos creations et evenements en images" />
          {galleryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : (
            <div className="mt-12">
              <GalleryGrid images={galleryImages} />
            </div>
          )}
          <div className="text-center mt-12">
            <Link href="/gallery">
              <Button variant="outline" size="lg">Voir Toute la Galerie</Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
