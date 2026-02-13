import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface GalleryImage {
  mediaId?: number;
  media_id?: number;
  title?: string;
  category?: string;
}

interface EnhancedGalleryGridProps {
  images: GalleryImage[];
  lastUpdate?: number; // Timestamp pour forcer le rechargement
}

export default function EnhancedGalleryGrid({ images, lastUpdate }: EnhancedGalleryGridProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [zoom, setZoom] = useState(0.8); // Zoom initial plus petit

  // Créer un cache buster basé sur la dernière mise à jour
  const cacheBuster = lastUpdate ? `?t=${lastUpdate}` : '';

  // Helper pour obtenir mediaId (supporte camelCase et snake_case)
  const getMediaId = (img: GalleryImage) => img.media_id || img.mediaId || 0;

  const openLightbox = (image: GalleryImage) => {
    const index = images.findIndex(img => getMediaId(img) === getMediaId(image));
    setLightboxImage(image);
    setLightboxIndex(index);
    setZoom(0.8); // Zoom initial plus petit
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    const newIndex = direction === "next" 
      ? (lightboxIndex + 1) % images.length
      : (lightboxIndex - 1 + images.length) % images.length;
    
    setLightboxIndex(newIndex);
    setLightboxImage(images[newIndex]);
    setZoom(0.8); // Reset zoom when changing image
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setZoom(0.8);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          navigateLightbox("prev");
          break;
        case "ArrowRight":
          navigateLightbox("next");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  return (
    <div>
      {/* Simple Grid - Images plus petites */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image, index) => {
          const mediaId = getMediaId(image);
          return (
          <div
            key={mediaId}
            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => openLightbox(image)}
          >
            <img
              src={`/api/media/${mediaId}${cacheBuster}`}
              alt={image.title || 'Gallery image'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              key={`${mediaId}-${lastUpdate || 0}`} // Force le rechargement quand lastUpdate change
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-2">
              <h3 className="font-medium text-sm text-center mb-1">{image.title || 'Image'}</h3>
              <Badge variant="outline" className="border-white text-white text-xs">
                {image.category || 'Galerie'}
              </Badge>
            </div>
          </div>
        )})}
      </div>

      {/* Lightbox améliorée - Image complète */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("prev");
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("next");
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setZoom(prev => Math.min(prev + 0.2, 2));
              }}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setZoom(prev => Math.max(prev - 0.2, 0.3));
              }}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Image - Taille adaptative et responsive */}
          <div className="flex items-center justify-center w-full h-full relative">
            <img
              src={`/api/media/${getMediaId(lightboxImage)}${cacheBuster}`}
              alt={lightboxImage.title || 'Image'}
              className="max-w-[calc(100vw-4rem)] max-h-[calc(100vh-8rem)] object-contain rounded-lg shadow-2xl"
              style={{ 
                transform: `scale(${zoom})`,
                transition: 'transform 0.3s ease-out',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
              key={`lightbox-${lightboxImage.mediaId}-${lastUpdate || 0}`} // Force le rechargement
            />
          </div>

          {/* Info */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className="bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm inline-block">
              <h3 className="font-semibold text-lg mb-1">{lightboxImage.title}</h3>
              <div className="flex items-center justify-center space-x-3 text-sm">
                <Badge variant="outline" className="border-white text-white">
                  {lightboxImage.category}
                </Badge>
                <span>{lightboxIndex + 1} / {images.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}