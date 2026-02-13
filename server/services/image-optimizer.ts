import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png";
  progressive?: boolean;
}

export class ImageOptimizer {
  private static readonly CACHE_DIR = "attached_assets/optimized";
  private static readonly MAX_WIDTH = 1600;
  private static readonly BREAKPOINTS = [400, 800, 1200, 1600];

  static async ensureCacheDir(): Promise<void> {
    try {
      await fs.access(this.CACHE_DIR);
    } catch {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
    }
  }

  static async optimizeImage(
    inputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<string[]> {
    const {
      quality = 75,
      format = "webp",
      progressive = true,
    } = options;

    await this.ensureCacheDir();

    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const optimizedPaths: string[] = [];

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Génère plusieurs tailles pour le responsive
      for (const width of this.BREAKPOINTS) {
        // Skip si l'image originale est plus petite
        if (metadata.width && metadata.width < width) continue;

        const outputFilename = `${inputBasename}_${width}w.${format}`;
        const outputPath = path.join(this.CACHE_DIR, outputFilename);

        // Vérifie si le fichier optimisé existe déjà
        try {
          await fs.access(outputPath);
          optimizedPaths.push(outputPath);
          continue; // Fichier existe déjà
        } catch {
          // Fichier n'existe pas, on le génère
        }

        let processor = image.clone().resize(width, undefined, {
          withoutEnlargement: true,
          fit: "inside"
        });

        if (format === "webp") {
          processor = processor.webp({ 
            quality, 
            effort: 6 // Meilleure compression
          });
        } else if (format === "jpeg") {
          processor = processor.jpeg({ 
            quality, 
            progressive,
            mozjpeg: true // Meilleure compression
          });
        } else if (format === "png") {
          processor = processor.png({ 
            quality,
            progressive,
            compressionLevel: 9
          });
        }

        await processor.toFile(outputPath);
        optimizedPaths.push(outputPath);

        console.log(`✓ Image optimisée: ${outputFilename} (${width}px, ${format})`);
      }

      return optimizedPaths;
    } catch (error) {
      console.error(`❌ Erreur lors de l'optimisation de ${inputPath}:`, error);
      throw error;
    }
  }

  static async optimizeExistingImages(): Promise<void> {
    console.log("🖼️  Démarrage de l'optimisation des images existantes...");

    const directories = [
      "attached_assets/uploads",
      "client/public"
    ];

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        const imageFiles = files.filter(file => 
          /\.(jpg|jpeg|png)$/i.test(file)
        );

        console.log(`📁 Optimisation du dossier ${dir}: ${imageFiles.length} images trouvées`);

        for (const file of imageFiles) {
          const fullPath = path.join(dir, file);
          
          try {
            // Optimise en WebP
            await this.optimizeImage(fullPath, { format: "webp" });
            
            // Garde aussi une version JPEG optimisée pour fallback
            await this.optimizeImage(fullPath, { format: "jpeg" });
          } catch (error) {
            console.error(`❌ Erreur avec ${file}:`, error);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Impossible de lire le dossier ${dir}:`, error);
      }
    }

    console.log("✅ Optimisation des images terminée");
  }

  static async getOptimizedImageInfo(originalPath: string): Promise<{
    webp: string[];
    fallback: string[];
    sizes: string;
  }> {
    const inputBasename = path.basename(originalPath, path.extname(originalPath));
    
    const webpImages = this.BREAKPOINTS.map(width => 
      `/optimized/${inputBasename}_${width}w.webp`
    );
    
    const fallbackImages = this.BREAKPOINTS.map(width => 
      `/optimized/${inputBasename}_${width}w.jpeg`
    );

    const sizes = "(max-width: 400px) 400px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1600px";

    return {
      webp: webpImages,
      fallback: fallbackImages,
      sizes
    };
  }

  // Middleware Express pour servir les images optimisées
  static middleware() {
    return async (req: any, res: any, next: any) => {
      const filePath = req.path;
      
      // Vérifie si c'est une requête d'image optimisée
      if (!filePath.startsWith("/optimized/")) {
        return next();
      }

      const imagePath = path.join(this.CACHE_DIR, path.basename(filePath));
      
      try {
        await fs.access(imagePath);
        
        // Headers de cache pour optimiser les performances
        res.set({
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': `"${Date.now()}"`,
        });

        res.sendFile(path.resolve(imagePath));
      } catch {
        res.status(404).send("Image not found");
      }
    };
  }
}