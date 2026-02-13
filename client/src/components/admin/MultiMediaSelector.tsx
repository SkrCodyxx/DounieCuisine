import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image, Video, Search, X, Check } from "lucide-react";

interface GalleryWithMedia {
  id: number;
  title: string;
  description: string | null;
  type: string;
  mediaId: number;
}

interface MultiMediaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mediaIds: number[]) => void;
  selectedMediaIds?: number[];
  mediaType?: "image" | "video" | "both";
  maxSelection?: number;
}

export default function MultiMediaSelector({
  open,
  onOpenChange,
  onSelect,
  selectedMediaIds = [],
  mediaType = "both",
  maxSelection
}: MultiMediaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [localSelection, setLocalSelection] = useState<number[]>(selectedMediaIds);

  // Récupérer tous les items de galerie
  const { data: galleryItems = [], isLoading } = useQuery<GalleryWithMedia[]>({
    queryKey: ["/api/admin/gallery"],
    queryFn: () => apiRequest("GET", "/api/admin/gallery"),
    enabled: open,
  });

  // Réinitialiser la sélection locale quand le dialog s'ouvre
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalSelection(selectedMediaIds);
    }
    onOpenChange(newOpen);
  };

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

  // Toggle sélection d'un média
  const toggleSelection = (mediaId: number) => {
    setLocalSelection(prev => {
      const isSelected = prev.includes(mediaId);
      
      if (isSelected) {
        // Désélectionner
        return prev.filter(id => id !== mediaId);
      } else {
        // Sélectionner (avec limite si définie)
        if (maxSelection && prev.length >= maxSelection) {
          return prev; // Ne pas ajouter si limite atteinte
        }
        return [...prev, mediaId];
      }
    });
  };

  // Confirmer la sélection
  const handleConfirm = () => {
    onSelect(localSelection);
    onOpenChange(false);
  };

  // Sélectionner tout
  const selectAll = () => {
    const allMediaIds = filteredItems.map(item => item.mediaId);
    if (maxSelection) {
      setLocalSelection(allMediaIds.slice(0, maxSelection));
    } else {
      setLocalSelection(allMediaIds);
    }
  };

  // Désélectionner tout
  const clearSelection = () => {
    setLocalSelection([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Sélectionner des médias
            {maxSelection && ` (max ${maxSelection})`}
          </DialogTitle>
        </DialogHeader>

        {/* Barre de recherche et actions */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un média..."
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

          {/* Actions rapides */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={filteredItems.length === 0}
              >
                Tout sélectionner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={localSelection.length === 0}
              >
                Tout désélectionner
              </Button>
            </div>
            
            <Badge variant={localSelection.length > 0 ? "default" : "secondary"}>
              {localSelection.length} sélectionné{localSelection.length !== 1 ? "s" : ""}
              {maxSelection && ` / ${maxSelection}`}
            </Badge>
          </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
              {filteredItems.map((item) => {
                const isSelected = localSelection.includes(item.mediaId);
                const isImage = item.type === "image";
                const isVideo = item.type === "video";
                const previewUrl = `/api/media/${item.mediaId}`;
                const canSelect = !maxSelection || localSelection.length < maxSelection || isSelected;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => canSelect && toggleSelection(item.mediaId)}
                    disabled={!canSelect}
                    className={`
                      relative group rounded-lg overflow-hidden border-2 transition-all
                      ${canSelect ? "hover:shadow-lg hover:scale-105" : "opacity-50 cursor-not-allowed"}
                      ${isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"}
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
                    <div className={`
                      absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                      transition-opacity
                      ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                    `}>
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                        <p className="text-xs font-semibold truncate">{item.title || "Sans titre"}</p>
                        {item.description && (
                          <p className="text-[10px] opacity-80 truncate">{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Badge type */}
                    <Badge
                      variant={isVideo ? "default" : "secondary"}
                      className="absolute top-2 right-2 h-5 px-1.5"
                    >
                      {isVideo ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                    </Badge>

                    {/* Indicateur sélection */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions du footer */}
        <div className="flex justify-between items-center pt-4 border-t gap-4">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} média{filteredItems.length !== 1 ? "s" : ""} disponible{filteredItems.length !== 1 ? "s" : ""}
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={localSelection.length === 0}
            >
              Ajouter ({localSelection.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
