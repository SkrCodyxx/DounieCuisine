import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const BREAKPOINTS = [400, 800, 1200, 1600];
const QUALITY = 75;

async function optimizeImage(inputPath, outputDir) {
  const inputBasename = path.basename(inputPath, path.extname(inputPath));
  
  console.log(`🖼️  Optimisation: ${inputBasename}`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`   Taille originale: ${metadata.width}x${metadata.height}`);
    
    for (const width of BREAKPOINTS) {
      if (metadata.width && metadata.width < width) continue;
      
      // WebP version
      const webpOutput = path.join(outputDir, `${inputBasename}_${width}w.webp`);
      await image
        .clone()
        .resize(width, undefined, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: QUALITY, effort: 6 })
        .toFile(webpOutput);
      
      // JPEG fallback
      const jpegOutput = path.join(outputDir, `${inputBasename}_${width}w.jpeg`);
      await image
        .clone()
        .resize(width, undefined, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
        .toFile(jpegOutput);
      
      console.log(`   ✓ ${width}px: WebP + JPEG`);
    }
    
    // Calculer la réduction de taille
    const originalStats = await fs.stat(inputPath);
    const webpStats = await fs.stat(path.join(outputDir, `${inputBasename}_800w.webp`));
    const reduction = ((originalStats.size - webpStats.size) / originalStats.size * 100).toFixed(1);
    
    console.log(`   📊 Réduction: ${reduction}% (${(originalStats.size/1024/1024).toFixed(1)}MB → ${(webpStats.size/1024/1024).toFixed(1)}MB)`);
    
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 OPTIMISATION DES IMAGES - DOUNIE CUISINE');
  console.log('===========================================');
  
  // Créer le dossier de sortie
  const outputDir = 'attached_assets/optimized';
  await fs.mkdir(outputDir, { recursive: true });
  
  const imageDirectories = [
    'attached_assets/uploads',
    'client/public'
  ];
  
  let totalProcessed = 0;
  
  for (const dir of imageDirectories) {
    try {
      const files = await fs.readdir(dir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
      
      console.log(`\n📁 Dossier: ${dir} (${imageFiles.length} images)`);
      
      for (const file of imageFiles) {
        const fullPath = path.join(dir, file);
        await optimizeImage(fullPath, outputDir);
        totalProcessed++;
      }
    } catch (error) {
      console.log(`⚠️  Dossier ${dir} non trouvé ou erreur:`, error.message);
    }
  }
  
  console.log(`\n✅ Optimisation terminée!`);
  console.log(`📊 ${totalProcessed} images traitées`);
  console.log(`🎯 Fichiers générés dans: ${outputDir}`);
}

main().catch(console.error);