"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import EnhancedGalleryGrid from "@/components/enhanced-gallery-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Image as ImageIcon, ArrowLeft, Camera } from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";

interface GalleryPhoto {
  id: number;
  albumId: number;
  mediaId: number;
  title: string | null;
  description: string | null;
  displayOrder: number;
  isActive: number;
}

interface GalleryAlbumDetail {
  id: number;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  coverImageId: number | null;
  category: string;
  displayOrder: number;
  isActive: number;
  isFeatured: number;
  photos: GalleryPhoto[];
}

export default function GalleryAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params?.id as string;

  const { data: album, isLoading, error } = useQuery<GalleryAlbumDetail>({
    queryKey: ["gallery-album", albumId],
    queryFn: () => fetch(`/api/gallery-albums/${albumId}`).then((r) => r.json()),
    enabled: !!albumId,
    staleTime: 90 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const galleryImages = album?.photos.map((photo) => ({
    mediaId: photo.mediaId,
    title: photo.title ?? album.title,
    category: album.category,
  })) ?? [];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative pb-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Button variant="ghost" onClick={() => router.push("/gallery")} className="mb-6 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />Retour a la galerie
          </Button>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4 bg-white/20" />
              <Skeleton className="h-6 w-1/2 bg-white/20" />
            </div>
          ) : album ? (
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{album.title}</h1>
              {album.description && <p className="text-xl text-gray-200 mb-6 max-w-3xl">{album.description}</p>}
              <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                {album.eventDate && (
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span className="capitalize">{formatDate(album.eventDate)}</span></div>
                )}
                {album.location && (
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{album.location}</span></div>
                )}
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" /><span>{album.photos.length} {album.photos.length === 1 ? "photo" : "photos"}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Photos */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-12 h-12 text-destructive" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4">Erreur de chargement</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">Impossible de charger cet album.</p>
              <Button onClick={() => router.push("/gallery")}>Retour a la galerie</Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          ) : galleryImages.length > 0 ? (
            <EnhancedGalleryGrid images={galleryImages} lastUpdate={Date.now()} />
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4">Aucune photo dans cet album</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">Les photos seront bientot disponibles.</p>
              <Button onClick={() => router.push("/gallery")}>Retour a la galerie</Button>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
