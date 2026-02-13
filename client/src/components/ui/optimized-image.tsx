import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean; // Pour les images critiques (pas de lazy loading)
  placeholder?: "blur" | "empty";
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  sizes = "100vw",
  priority = false,
  placeholder = "empty",
  quality = 75,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Si priority, on charge immédiatement
  const [error, setError] = useState(false);
  const [fallbackToOriginal, setFallbackToOriginal] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer pour lazy loading
  useEffect(() => {
    if (priority) return; // Pas de lazy loading si priorité

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px", // Commence à charger 50px avant que l'image soit visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Génération des URLs WebP optimisées
  const generateSrcSet = (baseSrc: string) => {
    const isExternal = baseSrc.startsWith('http');
    if (isExternal) return baseSrc; // Pas d'optimisation pour les images externes

    const filename = baseSrc.replace(/^\//, '').replace(/\.(jpg|jpeg|png)$/i, '');
    return [
      `/optimized/${filename}_400w.webp 400w`,
      `/optimized/${filename}_800w.webp 800w`,
      `/optimized/${filename}_1200w.webp 1200w`,
      `/optimized/${filename}_1600w.webp 1600w`,
    ].join(', ');
  };

  const generateFallbackSrc = (baseSrc: string) => {
    const isExternal = baseSrc.startsWith('http');
    if (isExternal) return baseSrc;

    const filename = baseSrc.replace(/^\//, '').replace(/\.(jpg|jpeg|png)$/i, '');
    const targetWidth = width || 800;
    
    // Essaie d'abord l'image optimisée, puis l'originale en fallback
    return `/optimized/${filename}_${targetWidth}w.jpeg`;
  };

  if (!isInView) {
    // Placeholder pendant le lazy loading
    return (
      <div
        ref={imgRef}
        className={cn(
          "bg-muted animate-pulse flex items-center justify-center",
          className
        )}
        style={{ width, height }}
        {...props}
      >
        {placeholder === "blur" && (
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Image principale avec WebP + fallback */}
      <picture>
        {!fallbackToOriginal && (
          <source 
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            type="image/webp"
          />
        )}
        <img
          ref={imgRef}
          src={fallbackToOriginal ? src : generateFallbackSrc(src)}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (!fallbackToOriginal) {
              setFallbackToOriginal(true); // Essaie l'image originale
            } else {
              setError(true);
            }
          }}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            error && "opacity-50"
          )}
          {...props}
        />
      </picture>

      {/* Overlay de chargement */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <svg
            className="w-8 h-8 text-muted-foreground animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              className="opacity-75"
            />
          </svg>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
          <svg
            className="w-8 h-8 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span className="text-sm">Erreur de chargement</span>
        </div>
      )}
    </div>
  );
}