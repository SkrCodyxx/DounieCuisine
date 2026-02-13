import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { uploadMedia } from "@/lib/upload";

interface MultipleImageUploadProps {
  onImagesUploaded: (imageIds: number[]) => void;
  maxFiles?: number;
  apiEndpoint?: string;
  label?: string;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  imageId?: number;
  previewUrl?: string;
}

export function MultipleImageUpload({ 
  onImagesUploaded,
  maxFiles = 30,
  apiEndpoint = "/api/admin/upload-media",
  label = "Upload Multiple Images",
  className = ""
}: MultipleImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Vérifier le nombre maximum de fichiers
    if (files.length > maxFiles) {
      toast({
        title: "Trop de fichiers",
        description: `Vous pouvez uploader maximum ${maxFiles} images à la fois`,
        variant: "destructive",
      });
      return;
    }

    // Vérifier que tous les fichiers sont des images
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Fichiers invalides",
        description: "Veuillez sélectionner uniquement des images",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille des fichiers
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Fichiers trop volumineux",
        description: "Chaque image doit faire moins de 5 MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Initialiser les fichiers en cours d'upload
    const initialFiles: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
      previewUrl: URL.createObjectURL(file)
    }));

    setUploadingFiles(initialFiles);

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          const id = await uploadMedia(file, apiEndpoint);
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index 
              ? { ...f, status: 'completed', progress: 100, imageId: id }
              : f
          ));
          return id;
        } catch (error) {
          console.error(`Erreur upload ${file.name}:`, error);
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index 
              ? { ...f, status: 'error', progress: 0 }
              : f
          ));
          throw error;
        }
      });

      // Attendre que tous les uploads se terminent
      const results = await Promise.allSettled(uploadPromises);
      
      // Collecter les IDs des images uploadées avec succès
      const successfulImageIds = results
        .filter((result): result is PromiseFulfilledResult<number> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      const failedCount = results.filter(result => result.status === 'rejected').length;

      if (successfulImageIds.length > 0) {
        onImagesUploaded(successfulImageIds);
        
        toast({
          title: "Upload terminé",
          description: `${successfulImageIds.length} image(s) uploadée(s) avec succès${failedCount > 0 ? `, ${failedCount} échec(s)` : ''}`,
        });
      }

      if (failedCount > 0 && successfulImageIds.length === 0) {
        toast({
          title: "Échec de l'upload",
          description: "Aucune image n'a pu être uploadée",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Erreur générale upload:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload des images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Nettoyer après 2 secondes
      setTimeout(() => {
        setUploadingFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => {
      const newFiles = [...prev];
      // Libérer l'URL de preview
      if (newFiles[index].previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <p className="text-xs text-muted-foreground">
          Sélectionnez jusqu'à {maxFiles} images (max 5 MB chacune)
        </p>
      </div>

      {/* Zone de drop */}
      <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
        <div className="flex flex-col items-center justify-center text-center">
          <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Sélectionnez vos images</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choisissez jusqu'à {maxFiles} images à uploader en même temps
          </p>
          
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mb-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Choisir les images
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Aperçu des fichiers en cours d'upload */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Images en cours d'upload ({uploadingFiles.length})</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadingFiles.map((file, index) => (
              <div key={index} className="relative border rounded-lg overflow-hidden">
                {file.previewUrl && (
                  <img
                    src={file.previewUrl}
                    alt={file.file.name}
                    className="w-full h-32 object-cover"
                  />
                )}
                
                {/* Overlay de statut */}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                  {file.status === 'uploading' && (
                    <div className="text-white text-center p-2">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-xs">{file.progress}%</p>
                    </div>
                  )}
                  
                  {file.status === 'completed' && (
                    <div className="text-white text-center p-2">
                      <div className="w-6 h-6 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                        ✓
                      </div>
                      <p className="text-xs">Terminé</p>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="text-white text-center p-2">
                      <div className="w-6 h-6 mx-auto mb-2 bg-red-500 rounded-full flex items-center justify-center">
                        ✗
                      </div>
                      <p className="text-xs">Erreur</p>
                    </div>
                  )}
                </div>

                {/* Bouton de suppression */}
                {!isUploading && (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeUploadingFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}

                {/* Nom du fichier */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-1">
                  <p className="text-xs truncate">{file.file.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress global */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression globale</span>
                <span>
                  {uploadingFiles.filter(f => f.status === 'completed').length} / {uploadingFiles.length}
                </span>
              </div>
              <Progress 
                value={(uploadingFiles.filter(f => f.status === 'completed').length / uploadingFiles.length) * 100}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}