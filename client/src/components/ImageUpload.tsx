import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadMedia } from "@/lib/upload";

interface ImageUploadProps {
  value?: number | null;
  imageUrl?: string | null;
  onChange: (imageId: number | null) => void;
  onImageUrlClear?: () => void;
  label?: string;
  className?: string;
  apiEndpoint?: string; // Nouveau paramètre pour spécifier l'API à utiliser
}

export function ImageUpload({ value, imageUrl, onChange, onImageUrlClear, label = "Image", className = "", apiEndpoint = "/api/admin/upload-media" }: ImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentImageUrl = previewUrl || (value ? `/api/media/${value}` : (imageUrl || null));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image doit faire moins de 5 MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
  const id = await uploadMedia(file, apiEndpoint);
  const url = `/api/media/${id}`;
  setPreviewUrl(url);
      onChange(id);
      toast({ title: "Succès", description: "Image uploadée avec succès" });
    } catch (error) {
      console.error("Erreur upload:", error);
      toast({
        title: "Erreur",
        description: "Échec de l'upload de l'image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreviewUrl(null);
    if (onImageUrlClear) {
      onImageUrlClear();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      
      <div className="border-2 border-dashed rounded-lg p-4 hover-elevate">
        {currentImageUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md"
              data-testid="image-preview"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={isUploading}
              data-testid="button-remove-image"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">Aucune image</p>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="image-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isUploading}
              asChild
              data-testid="button-upload-image"
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {currentImageUrl ? "Remplacer l'image" : "Uploader une image"}
                  </>
                )}
              </span>
            </Button>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
            data-testid="input-file-upload"
          />
        </div>
      </div>
      
      {currentImageUrl && (
        <p className="text-xs text-muted-foreground">
          {value ? `Image ID: ${value}` : "URL externe"}
        </p>
      )}
    </div>
  );
}
