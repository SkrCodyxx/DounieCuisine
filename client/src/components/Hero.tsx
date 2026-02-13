import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@shared/schema";
import { getMediaUrl, getLogoUrl } from "@/lib/image-utils";

interface HeroProps {
  onOrderClick?: () => void;
  onMenuClick?: () => void;
}

// Helper: Map text position to Tailwind classes
const getPositionClasses = (position?: string | null) => {
  switch (position) {
    case "top-left": return "top-8 left-8 items-start text-left";
    case "top-center": return "top-8 left-1/2 -translate-x-1/2 items-center text-center";
    case "top-right": return "top-8 right-8 items-end text-right";
    case "center-left": return "top-1/2 -translate-y-1/2 left-8 items-start text-left";
    case "center": return "top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center text-center";
    case "center-right": return "top-1/2 -translate-y-1/2 right-8 items-end text-right";
    case "bottom-left": return "bottom-8 left-8 items-start text-left";
    case "bottom-center": return "bottom-8 left-1/2 -translate-x-1/2 items-center text-center";
    case "bottom-right": return "bottom-8 right-8 items-end text-right";
    default: return "top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center text-center";
  }
};

// Helper: Map logo size to Tailwind classes (responsive with viewport constraints)
const getLogoSizeClasses = (size?: string | null) => {
  switch (size) {
    case "small": return "h-40 md:h-48 lg:h-56 max-h-[35vh] max-w-full";      // Up to 35% viewport height
    case "medium": return "h-56 md:h-72 lg:h-96 max-h-[60vh] max-w-full";     // Up to 60% viewport height
    case "large": return "h-72 md:h-96 lg:h-[28rem] max-h-[70vh] max-w-full";      // Up to 70% viewport height (très dominant)
    default: return "h-56 md:h-72 lg:h-96 max-h-[60vh] max-w-full";
  }
};

// Helper: Parse text content (JSON or HTML)
const parseTextContent = (textContent: string | null | undefined) => {
  if (!textContent) return null;
  
  try {
    return JSON.parse(textContent);
  } catch {
    // If not JSON, treat as HTML
    return { html: textContent };
  }
};

export default function Hero({ onOrderClick, onMenuClick }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch hero slides from API
  const { data: apiSlides, isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
  });

  // Robustesse: garantir un tableau pour éviter les erreurs .map si une erreur backend renvoie un objet
  const slides: HeroSlide[] = Array.isArray(apiSlides) ? apiSlides : [];


  // Définir les fonctions de navigation avant les useEffect qui les utilisent
  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-play avec pause au hover
  useEffect(() => {
    if (slides.length === 0 || isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, nextSlide, prevSlide]);

  // Force video playback on slide change
  useEffect(() => {
    // Select only videos within the hero slider
    const heroContainer = document.querySelector('.hero-slider-container');
    if (!heroContainer) return;
    
    const videos = heroContainer.querySelectorAll('video');
    videos.forEach((video, idx) => {
      if (idx === currentSlide) {
        video.currentTime = 0; // Restart from beginning
        // Essayer d'abord avec le son, puis sans si bloqué
        video.muted = false;
        video.play().catch((error) => {
          video.muted = true;
          video.play().catch((error2) => {
            // Try again after a small delay
            setTimeout(() => {
              video.play().catch(() => {});
            }, 100);
          });
        });
      } else {
        video.pause();
        video.currentTime = 0; // Reset when not visible
      }
    });
  }, [currentSlide, slides.length]);

  const renderMedia = (slide: HeroSlide, index: number) => {
    const isCurrentSlide = index === currentSlide;
    
    const mediaUrl = getMediaUrl(slide);
    if (!mediaUrl) {
      console.error(`❌ AUCUNE URL MÉDIA - Slide ${index + 1}: "${slide.title || 'Sans titre'}" - Media ID: ${(slide as any).media_id || slide.mediaId || 'MANQUANT'}`);
      return null;
    }
    
    if (slide.mediaType === "video" || (slide as any).media_type === "video") {
      // For video URLs (YouTube, Vimeo, etc.) - extract embed URL
      const getEmbedUrl = (url: string) => {
        // YouTube
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          const videoId = url.includes("youtu.be") 
            ? url.split("/").pop()?.split("?")[0]
            : new URL(url).searchParams.get("v");
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
        }
        // Vimeo
        if (url.includes("vimeo.com")) {
          const videoId = url.split("/").pop();
          return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`;
        }
        // Direct video file
        return url;
      };

      const embedUrl = getEmbedUrl(mediaUrl);
      
      // If it's a direct video file (check for extensions OR /api/media/ path for uploaded videos)
      const isDirectVideo = embedUrl === mediaUrl && (
        embedUrl.endsWith(".mp4") || 
        embedUrl.endsWith(".webm") || 
        embedUrl.endsWith(".mov") ||
        embedUrl.includes("/api/media/")
      );

      
      if (isDirectVideo) {
        return (
          <div 
            className="h-full w-full relative"
            style={{ display: isCurrentSlide ? 'block' : 'none' }}
          >
            <video
              key={`video-${slide.id}-${index}`}
              src={embedUrl}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted={false}  // Permettre le son
              playsInline
              preload="auto"
              disablePictureInPicture
              style={{ 
                objectFit: 'cover',
                backgroundColor: '#000'  // Fond noir au lieu de gris pendant le chargement
              }}
              onLoadedMetadata={(e) => {
                if (isCurrentSlide) {
                  const video = e.currentTarget;
                  video.currentTime = 0;
                  // Essayer d'abord avec le son
                  video.play().catch((err) => {
                    // Si bloqué, tenter sans son
                    video.muted = true;
                    video.play().catch(() => {});
                  });
                }
              }}
              onCanPlay={(e) => {
                if (isCurrentSlide) {
                  const video = e.currentTarget;
                  video.play().catch(() => {});
                }
              }}
              onLoadedData={(e) => {
                if (isCurrentSlide) {
                  const video = e.currentTarget;
                  video.play().catch(() => {});
                }
              }}
              onError={(e) => {
                console.error(`❌ ERREUR FATALE - Vidéo non trouvée: ${slide.title || 'Sans titre'} - URL: ${embedUrl}`);
              }}
              onPlay={() => {
                console.log(`✅ Vidéo lancée avec succès: ${slide.title || 'Sans titre'}`);
              }}
              onPause={() => {
                console.log(`⏸️ Vidéo en pause: ${slide.title || 'Sans titre'}`);
              }}
            />
          </div>
        );
      }
      
      // If it's an embed URL
      return (
        <iframe
          src={embedUrl}
          className="h-full w-full object-cover pointer-events-none"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        />
      );
    }

    // Default: image
    return (
      <img
        src={mediaUrl}
        alt={slide.altText || "Hero slide"}
        className="h-full w-full object-cover"
      />
    );
  };

  // Show loading state
  if (isLoading || slides.length === 0) {
    return (
      <div className="relative pt-32 min-h-screen lg:min-h-[calc(100vh+8rem)] xl:min-h-[calc(100vh+12rem)] w-full bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div 
      className="hero-slider-container relative pt-32 min-h-screen lg:min-h-[calc(100vh+8rem)] xl:min-h-[calc(100vh+12rem)] w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Hero carousel"
      aria-live="polite"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          style={{ 
            visibility: index === currentSlide ? 'visible' : 'hidden' 
          }}
        >
          {renderMedia(slide, index)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[5]" />
        </div>
      ))}

      {/* Dynamic Slide Overlay */}
      {slides.map((slide, index) => {
        if (index !== currentSlide) return null;
        
        const textContent = (slide as any).textContent || (slide as any).text_content;
        const textPosition = (slide as any).textPosition || (slide as any).text_position;
        const logoSize = (slide as any).logoSize || (slide as any).logo_size;
        const logoVisible = (slide as any).logoVisible !== undefined ? (slide as any).logoVisible : (slide as any).logo_visible;
        const parsedContent = parseTextContent(textContent);
        

        
        return (
          <div 
            key={`overlay-${slide.id}`}
            className={`absolute px-4 md:px-8 lg:px-12 z-20 flex flex-col max-w-4xl ${getPositionClasses(textPosition)}`}
          >
            {/* Custom Logo */}
            {getLogoUrl(slide) && logoVisible === 1 && (
              <div className="mb-2">
                <img 
                  src={getLogoUrl(slide)!} 
                  alt="Slide Logo" 
                  className={`${getLogoSizeClasses(logoSize)} w-auto object-contain drop-shadow-2xl`}
                  data-testid={`img-slide-logo-${index}`}
                />
              </div>
            )}
            
            {/* Custom Text Content - JSON Format */}
            {parsedContent && 'heading' in parsedContent && (
              <div className="flex flex-col items-center text-center">
                {parsedContent.heading && (
                  <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 max-w-5xl drop-shadow-lg">
                    {parsedContent.heading}
                  </h1>
                )}
                
                {parsedContent.subheading && (
                  <p className="text-2xl md:text-4xl lg:text-5xl text-white/95 font-semibold mb-8 max-w-4xl drop-shadow-md leading-tight">
                    {parsedContent.subheading}
                  </p>
                )}
                
                {parsedContent.buttonText && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={() => {
                        const url = parsedContent.buttonUrl || parsedContent.buttonLink;
                        if (url) {
                          // Si c'est une URL relative, utiliser le router
                          if (url.startsWith('/')) {
                            window.location.href = url;
                          } else {
                            // Si c'est une URL externe, ouvrir dans le même onglet
                            window.location.href = url;
                          }
                        }
                      }}
                      className="text-lg px-8 bg-orange-600 hover:bg-orange-700 shadow-xl"
                      data-testid={`button-slide-action-${index}`}
                    >
                      {parsedContent.buttonText}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Custom Text Content - HTML Format */}
            {parsedContent && 'html' in parsedContent && (
              <div 
                className="text-white drop-shadow-lg prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: parsedContent.html }}
                data-testid={`text-slide-content-${index}`}
              />
            )}
          </div>
        );
      })}

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-2/3 -translate-y-1/2 z-20 w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover-elevate active-elevate-2 text-white touch-manipulation"
            data-testid="button-prev-slide"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 md:w-6 md:h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-2/3 -translate-y-1/2 z-20 w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover-elevate active-elevate-2 text-white touch-manipulation"
            data-testid="button-next-slide"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 md:w-6 md:h-6" />
          </button>

          <div className="absolute bottom-20 md:bottom-24 lg:bottom-28 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-white w-8" : "bg-white/50"
                }`}
                data-testid={`dot-slide-${index}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
