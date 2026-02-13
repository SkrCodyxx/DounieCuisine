import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadMedia } from "@/lib/upload";
import MediaSelector from "@/components/admin/MediaSelector";

export interface SingleUploadProps {
  label?: string;
  value?: number | null;
  onChange: (id: number | null) => void;
  accept?: string;
  description?: string;
  apiEndpoint?: string; // default /api/admin/upload-media
  enableGallerySelect?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SingleUpload({
  label = "Image",
  value,
  onChange,
  accept = "image/*,video/*",
  description,
  apiEndpoint = "/api/admin/upload-media",
  enableGallerySelect = true,
  disabled = false,
  className = "",
}: SingleUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const currentUrl = value ? `/api/media/${value}` : undefined;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation: 5MB limit to match server configuration
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 5 MB", variant: "destructive" });
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const id = await uploadMedia(file, apiEndpoint);
      onChange(id);
      toast({ title: "Upload réussi", description: "Le fichier a été uploadé" });
    } catch (err: any) {
      toast({ title: "Erreur d'upload", description: err?.message || "Échec de l'upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const clearMedia = () => onChange(null);

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium block">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {/* Preview */}
      {currentUrl ? (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
          <img src={currentUrl} alt="Aperçu" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearMedia}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground bg-muted/30">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-60" />
          <p className="text-sm">Aucune image sélectionnée</p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <input type="file" id={`single-upload-${label}`} accept={accept} className="hidden" onChange={handleFileSelect} disabled={disabled || isUploading} />
          <label htmlFor={`single-upload-${label}`} className="cursor-pointer">
            <Button type="button" variant="outline" className="w-full" disabled={disabled || isUploading} asChild>
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {currentUrl ? "Remplacer" : "Uploader"}
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
        {enableGallerySelect && (
          <Button type="button" variant="outline" onClick={() => setIsSelectorOpen(true)} disabled={disabled || isUploading}>
            Galerie
          </Button>
        )}
      </div>

      {enableGallerySelect && (
        <MediaSelector
          open={isSelectorOpen}
          onOpenChange={setIsSelectorOpen}
          currentMediaId={value || undefined}
          onSelect={(id) => {
            onChange(id);
            setIsSelectorOpen(false);
          }}
          mediaType="image"
        />
      )}
    </div>
  );
}
