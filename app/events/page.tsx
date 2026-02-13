"use client";

import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { apiRequest } from "@/lib/query-client";
import { getImageUrl } from "@/lib/image-utils";
import type { Event } from "@/lib/schema";

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest<Event[]>("GET", "/api/events"),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-balance">Evenements</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {"Decouvrez nos evenements a venir et rejoignez-nous pour des celebrations inoubliables"}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">Aucun evenement a venir</p>
              <p className="text-muted-foreground mt-2">Revenez bientot pour decouvrir nos prochains evenements</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => {
                const imageUrl = getImageUrl(event);
                return (
                  <div key={event.id} className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                    {imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={event.title} className="w-full h-48 object-cover" loading="lazy" />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{event.description}</p>
                      {event.activityDate && (
                        <p className="text-sm text-primary font-medium">
                          {new Date(event.activityDate).toLocaleDateString("fr-CA", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                      {event.location && <p className="text-sm text-muted-foreground mt-1">{event.location}</p>}
                      {event.price && parseFloat(String(event.price)) > 0 && (
                        <p className="text-lg font-bold text-primary mt-3">{parseFloat(String(event.price)).toFixed(2)} $ CAD</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
