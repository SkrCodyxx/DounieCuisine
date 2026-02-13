"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera } from "lucide-react";
import { apiRequest } from "@/lib/query-client";
import { getCoverImageUrl } from "@/lib/image-utils";
import type { GalleryAlbum } from "@/lib/schema";

interface AlbumWithCount extends GalleryAlbum {
  photoCount: number;
}

export default function GalleryPage() {
  const { data: albums = [], isLoading } = useQuery<AlbumWithCount[]>({
    queryKey: ["/api/gallery-albums"],
    queryFn: () => apiRequest<AlbumWithCount[]>("GET", "/api/gallery-albums"),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-balance">Galerie</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {"Decouvrez nos evenements et creations culinaires en images"}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">Aucun album pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => {
                const coverUrl = getCoverImageUrl(album);
                return (
                  <Link key={album.id} href={`/gallery/${album.id}`} className="group">
                    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-12 h-12 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{album.title}</h3>
                        {album.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{album.description}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
