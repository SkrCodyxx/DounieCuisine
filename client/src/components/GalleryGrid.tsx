import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface GalleryImage {
  mediaId?: number;
  media_id?: number;
  title?: string;
  category?: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  lastUpdate?: number; // Timestamp pour forcer le rechargement
}

export default function GalleryGrid({ images, lastUpdate }: GalleryGridProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  // Créer un cache buster basé sur la dernière mise à jour
  const cacheBuster = lastUpdate ? `?t=${lastUpdate}` : '';

  // Helper pour obtenir mediaId (supporte camelCase et snake_case)
  const getMediaId = (img: GalleryImage) => img.media_id || img.mediaId || 0;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image, index) => {
          const mediaId = getMediaId(image);
          return (
          <div
            key={index}
            className="relative aspect-square overflow-hidden rounded-md cursor-pointer group"
            onClick={() => setLightboxImage(image)}
            data-testid={`gallery-image-${index}`}
          >
            <img
              src={`/api/media/${mediaId}${cacheBuster}`}
              alt={image.title || 'Gallery image'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4">
              <h3 className="font-semibold text-lg mb-1">{image.title || 'Image'}</h3>
              <Badge variant="outline" className="border-white text-white">
                {image.category || 'Galerie'}
              </Badge>
            </div>
          </div>
        )})}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
            data-testid="button-close-lightbox"
          >
            <X className="w-6 h-6" />
          </Button>
          
          {/* Container pour l'image avec dimensions contrôlées */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <img
              src={`/api/media/${getMediaId(lightboxImage)}${cacheBuster}`}
              alt={lightboxImage.title || 'Image'}
              className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] object-contain rounded-lg shadow-2xl"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
            
            {/* Informations en overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-semibold text-xl mb-1">{lightboxImage.title || 'Image'}</h3>
              <Badge variant="outline" className="border-white text-white">
                {lightboxImage.category || 'Galerie'}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
