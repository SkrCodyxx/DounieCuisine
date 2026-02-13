import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EnhancedGalleryGrid from "@/components/EnhancedGalleryGrid";
import { Calendar, MapPin, Image as ImageIcon, ArrowLeft, Camera } from "lucide-react";

interface GalleryPhoto {
  id: number;
  albumId: number;
  mediaId: number;
  title: string | null;
  description: string | null;
  displayOrder: number;
  isActive: number;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
  photos: GalleryPhoto[];
}

export default function GalleryAlbumPage() {
  const [, params] = useRoute("/gallery/:id");
  const [, setLocation] = useLocation();
  const albumId = params?.id;

  // Cache long - contenu d'album spécifique change rarement
  const { data: album, isLoading, error } = useQuery<GalleryAlbumDetail>({
    queryKey: [`/api/gallery-albums/${albumId}`],
    enabled: !!albumId,
    staleTime: 90 * 60 * 1000, // 1h30 - contenu album stable
    gcTime: 3 * 60 * 60 * 1000, // 3 heures en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Convertir les photos au format attendu par EnhancedGalleryGrid
  const galleryImages = album?.photos.map((photo: any) => ({
    mediaId: photo.media_id || photo.mediaId,
    media_id: photo.media_id || photo.mediaId,
    title: photo.title || album.title,
    category: album.category,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 relative">
      {/* Motifs décoratifs en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 right-20 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="relative z-10">
        <TopInfoBar />
        <Navigation />

        {/* Section Hero avec informations de l'album - connexion parfaite TopInfoBar > Navigation > Hero */}
        <section className="relative pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 pb-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Motifs décoratifs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/gallery")}
              className="mb-6 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la galerie
            </Button>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4 bg-white/20" />
                <Skeleton className="h-6 w-1/2 bg-white/20" />
              </div>
            ) : album ? (
              <div className="text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {album.title}
                </h1>
                
                {album.description && (
                  <p className="text-xl text-gray-200 mb-6 max-w-3xl">
                    {album.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                  {album.eventDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="capitalize">{formatDate(album.eventDate)}</span>
                    </div>
                  )}
                  
                  {album.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{album.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span>{album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Contenu - Photos de l'album */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-orange-50/20 to-white relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            {error ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-12 h-12 text-red-400" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                  Erreur de chargement
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Impossible de charger cet album. Veuillez réessayer.
                </p>
                <Button onClick={() => setLocation("/gallery")}>
                  Retour à la galerie
                </Button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                ))}
              </div>
            ) : galleryImages.length > 0 ? (
              <EnhancedGalleryGrid images={galleryImages} lastUpdate={Date.now()} />
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                  Aucune photo dans cet album
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Les photos de cet événement seront bientôt disponibles.
                </p>
                <Button onClick={() => setLocation("/gallery")}>
                  Retour à la galerie
                </Button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
