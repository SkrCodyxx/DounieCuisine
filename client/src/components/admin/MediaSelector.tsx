import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image, Video, Search, X } from "lucide-react";

interface GalleryWithMedia {
  id: number;
  title: string;
  description: string | null;
  type: string;
  mediaId: number;
}

interface MediaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mediaId: number) => void;
  currentMediaId?: number;
  mediaType?: "image" | "video" | "both";
}

export default function MediaSelector({
  open,
  onOpenChange,
  onSelect,
  currentMediaId,
  mediaType = "both"
}: MediaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Récupérer tous les items de galerie (qui contiennent les médias)
  const { data: galleryItems = [], isLoading } = useQuery<GalleryWithMedia[]>({
    queryKey: ["/api/admin/gallery"],
    queryFn: () => apiRequest("GET", "/api/admin/gallery"),
    enabled: open,
  });

  // Filtrer par type et recherche
  const filteredItems = galleryItems.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const isImage = item.type === "image";
    const isVideo = item.type === "video";
    
    if (mediaType === "both") return matchesSearch;
    if (mediaType === "image") return matchesSearch && isImage;
    if (mediaType === "video") return matchesSearch && isVideo;
    return matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sélectionner un média</DialogTitle>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Grille de médias */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Chargement des médias...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                {searchTerm ? "Aucun média trouvé" : "Aucun média disponible"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
              {filteredItems.map((item) => {
                const isImage = item.type === "image";
                const isVideo = item.type === "video";
                const previewUrl = `/api/media/${item.mediaId}`;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.mediaId)}
                    className={`
                      relative group rounded-lg overflow-hidden border-2 transition-all
                      hover:shadow-lg hover:scale-105
                      ${currentMediaId === item.mediaId ? "border-primary ring-2 ring-primary" : "border-transparent"}
                    `}
                  >
                    {/* Aperçu du média */}
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {isImage ? (
                        <img
                          src={previewUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : isVideo ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/10">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                            Vidéo
                          </span>
                        </div>
                      ) : (
                        <Image className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    {/* Overlay avec infos */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-sm font-semibold truncate">{item.title || "Sans titre"}</p>
                        {item.description && (
                          <p className="text-xs opacity-80 truncate">{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Badge type */}
                    <Badge
                      variant={isVideo ? "default" : "secondary"}
                      className="absolute top-2 right-2"
                    >
                      {isVideo ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                    </Badge>

                    {/* Indicateur sélection */}
                    {currentMediaId === item.mediaId && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} média{filteredItems.length !== 1 ? "s" : ""} disponible{filteredItems.length !== 1 ? "s" : ""}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
