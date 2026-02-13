"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";

interface GalleryImage {
  mediaId?: number;
  title?: string;
  category?: string;
}

interface EnhancedGalleryGridProps {
  images: GalleryImage[];
  lastUpdate?: number;
}

export default function EnhancedGalleryGrid({ images, lastUpdate }: EnhancedGalleryGridProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(0.8);

  const cacheBuster = lastUpdate ? `?t=${lastUpdate}` : "";
  const getMediaId = (img: GalleryImage) => img.mediaId ?? 0;

  const openLightbox = (image: GalleryImage) => {
    const index = images.findIndex((img) => getMediaId(img) === getMediaId(image));
    setLightboxImage(image);
    setLightboxIndex(index);
    setZoom(0.8);
  };

  const navigateLightbox = useCallback(
    (direction: "prev" | "next") => {
      const newIndex =
        direction === "next"
          ? (lightboxIndex + 1) % images.length
          : (lightboxIndex - 1 + images.length) % images.length;
      setLightboxIndex(newIndex);
      setLightboxImage(images[newIndex]);
      setZoom(0.8);
    },
    [lightboxIndex, images]
  );

  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
    setZoom(0.8);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") navigateLightbox("prev");
      else if (e.key === "ArrowRight") navigateLightbox("next");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, closeLightbox, navigateLightbox]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image) => {
          const mediaId = getMediaId(image);
          return (
            <div
              key={mediaId}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => openLightbox(image)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openLightbox(image)}
              aria-label={image.title ?? "Gallery image"}
            >
              <img
                src={`${getImageUrl(mediaId)}${cacheBuster}`}
                alt={image.title ?? "Gallery image"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-2">
                <h3 className="font-medium text-sm text-center mb-1">{image.title ?? "Image"}</h3>
                <Badge variant="outline" className="border-white text-white text-xs">
                  {image.category ?? "Galerie"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {images.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 0.2, 2)); }} aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 0.2, 0.3)); }} aria-label="Zoom out">
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={closeLightbox} aria-label="Close lightbox">
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center justify-center w-full h-full">
            <img
              src={`${getImageUrl(getMediaId(lightboxImage))}${cacheBuster}`}
              alt={lightboxImage.title ?? "Image"}
              className="max-w-[calc(100vw-4rem)] max-h-[calc(100vh-8rem)] object-contain rounded-lg shadow-2xl"
              style={{ transform: `scale(${zoom})`, transition: "transform 0.3s ease-out" }}
              onClick={(e) => e.stopPropagation()}
              crossOrigin="anonymous"
            />
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className="bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm inline-block">
              <h3 className="font-semibold text-lg mb-1">{lightboxImage.title}</h3>
              <div className="flex items-center justify-center gap-3 text-sm">
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
