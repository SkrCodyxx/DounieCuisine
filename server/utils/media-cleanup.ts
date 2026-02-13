import { sql } from 'drizzle-orm';
import { db } from '../db.js';
import fs from 'fs';
import path from 'path';

export interface UnusedMedia {
  id: number;
  filename: string;
  byte_length: number;
  created_at: string;
}

/**
 * Trouve toutes les images non utilisées dans la base de données
 */
export async function findUnusedMedia(): Promise<UnusedMedia[]> {
  const result = await db.execute(sql`
    SELECT m.id, m.filename, m.byte_length, m.created_at
    FROM media_assets m
    WHERE m.id NOT IN (
      -- Images utilisées dans site_info (logo)
      SELECT logo_id FROM site_info WHERE logo_id IS NOT NULL
      UNION
      -- Images utilisées dans hero_slides
      SELECT media_id FROM hero_slides WHERE media_id IS NOT NULL
      UNION
      -- Images utilisées dans dishes
      SELECT image_id FROM dishes WHERE image_id IS NOT NULL
      UNION
      -- Images utilisées dans events
      SELECT image_id FROM events WHERE image_id IS NOT NULL
      UNION
      -- Images utilisées dans gallery
      SELECT media_id FROM gallery WHERE media_id IS NOT NULL
      UNION
      -- Images utilisées dans gallery (thumbnail)
      SELECT thumbnail_id FROM gallery WHERE thumbnail_id IS NOT NULL
      UNION
      -- Images utilisées dans testimonials
      SELECT client_photo_id FROM testimonials WHERE client_photo_id IS NOT NULL
    )
    ORDER BY m.created_at ASC
  `);

  return result.rows as unknown as UnusedMedia[];
}

/**
 * Trouve les images dupliquées (même nom de fichier)
 */
export async function findDuplicateMedia(): Promise<Array<{
  filename: string;
  count: number;
  ids: number[];
  total_size: number;
}>> {
  const result = await db.execute(sql`
    SELECT 
      filename,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY created_at ASC) as ids,
      SUM(byte_length) as total_size
    FROM media_assets 
    GROUP BY filename 
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, filename
  `);

  return result.rows as Array<{
    filename: string;
    count: number;
    ids: number[];
    total_size: number;
  }>;
}

/**
 * Supprime une image de la base de données et du système de fichiers (si applicable)
 */
export async function deleteMediaAsset(mediaId: number): Promise<boolean> {
  try {
    // Vérifier que l'image n'est pas utilisée avant de la supprimer
    const usageCheck = await db.execute(sql`
      SELECT 'site_info' as table_name, logo_id as media_id FROM site_info WHERE logo_id = ${mediaId}
      UNION ALL
      SELECT 'hero_slides' as table_name, media_id FROM hero_slides WHERE media_id = ${mediaId}
      UNION ALL
      SELECT 'dishes' as table_name, image_id as media_id FROM dishes WHERE image_id = ${mediaId}
      UNION ALL
      SELECT 'events' as table_name, image_id as media_id FROM events WHERE image_id = ${mediaId}
      UNION ALL
      SELECT 'gallery' as table_name, media_id FROM gallery WHERE media_id = ${mediaId}
      UNION ALL
      SELECT 'gallery_thumbnail' as table_name, thumbnail_id as media_id FROM gallery WHERE thumbnail_id = ${mediaId}
      UNION ALL
      SELECT 'testimonials' as table_name, client_photo_id as media_id FROM testimonials WHERE client_photo_id = ${mediaId}
    `);

    if (usageCheck.rows.length > 0) {
      console.warn(`Tentative de suppression de l'image ${mediaId} qui est encore utilisée dans:`, usageCheck.rows);
      return false;
    }

    // Supprimer de la base de données
    const deleteResult = await db.execute(sql`
      DELETE FROM media_assets WHERE id = ${mediaId}
    `);

    return (deleteResult.rowCount ?? 0) > 0;
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'image ${mediaId}:`, error);
    return false;
  }
}

/**
 * Nettoie toutes les images non utilisées
 */
export async function cleanupUnusedMedia(): Promise<{
  deleted: number[];
  failed: number[];
  totalSizeFreed: number;
}> {
  const unusedMedia = await findUnusedMedia();
  const deleted: number[] = [];
  const failed: number[] = [];
  let totalSizeFreed = 0;

  console.log(`Nettoyage de ${unusedMedia.length} images non utilisées...`);

  for (const media of unusedMedia) {
    const success = await deleteMediaAsset(media.id);
    if (success) {
      deleted.push(media.id);
      totalSizeFreed += media.byte_length;
      console.log(`✅ Image supprimée: ${media.filename} (ID: ${media.id}, ${formatFileSize(media.byte_length)})`);
    } else {
      failed.push(media.id);
      console.log(`❌ Échec suppression: ${media.filename} (ID: ${media.id})`);
    }
  }

  return { deleted, failed, totalSizeFreed };
}

/**
 * Nettoie les doublons en gardant le plus récent de chaque groupe
 */
export async function cleanupDuplicateMedia(): Promise<{
  deleted: number[];
  failed: number[];
  totalSizeFreed: number;
}> {
  const duplicates = await findDuplicateMedia();
  const deleted: number[] = [];
  const failed: number[] = [];
  let totalSizeFreed = 0;

  console.log(`Nettoyage de ${duplicates.length} groupes de doublons...`);

  for (const duplicate of duplicates) {
    // Garder le plus récent (dernier dans la liste), supprimer les autres
    const idsToDelete = duplicate.ids.slice(0, -1); // Tous sauf le dernier
    const keepId = duplicate.ids[duplicate.ids.length - 1]; // Le dernier (plus récent)

    console.log(`Doublon "${duplicate.filename}": garder ID ${keepId}, supprimer IDs [${idsToDelete.join(', ')}]`);

    for (const idToDelete of idsToDelete) {
      const success = await deleteMediaAsset(idToDelete);
      if (success) {
        deleted.push(idToDelete);
        // Calculer la taille approximative (taille totale / nombre de copies)
        const approximateSize = Math.floor(duplicate.total_size / duplicate.count);
        totalSizeFreed += approximateSize;
        console.log(`✅ Doublon supprimé: ${duplicate.filename} (ID: ${idToDelete})`);
      } else {
        failed.push(idToDelete);
        console.log(`❌ Échec suppression doublon: ${duplicate.filename} (ID: ${idToDelete})`);
      }
    }
  }

  return { deleted, failed, totalSizeFreed };
}

/**
 * Nettoyage complet : doublons + images non utilisées
 */
export async function fullMediaCleanup(): Promise<{
  duplicatesDeleted: number[];
  duplicatesFailed: number[];
  unusedDeleted: number[];
  unusedFailed: number[];
  totalSizeFreed: number;
}> {
  console.log('🧹 Début du nettoyage complet des médias...');

  // 1. Nettoyer les doublons d'abord
  const duplicateResults = await cleanupDuplicateMedia();
  
  // 2. Nettoyer les images non utilisées
  const unusedResults = await cleanupUnusedMedia();

  const totalSizeFreed = duplicateResults.totalSizeFreed + unusedResults.totalSizeFreed;

  console.log(`\n📊 Résumé du nettoyage:`);
  console.log(`- Doublons supprimés: ${duplicateResults.deleted.length}`);
  console.log(`- Images inutiles supprimées: ${unusedResults.deleted.length}`);
  console.log(`- Espace libéré: ${formatFileSize(totalSizeFreed)}`);
  console.log(`- Échecs: ${duplicateResults.failed.length + unusedResults.failed.length}`);

  return {
    duplicatesDeleted: duplicateResults.deleted,
    duplicatesFailed: duplicateResults.failed,
    unusedDeleted: unusedResults.deleted,
    unusedFailed: unusedResults.failed,
    totalSizeFreed
  };
}

/**
 * Formate la taille de fichier en format lisible
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtient un rapport sur l'utilisation des médias
 */
export async function getMediaUsageReport(): Promise<{
  total: number;
  used: number;
  unused: number;
  duplicates: number;
  totalSize: number;
  unusedSize: number;
}> {
  // Total des images
  const totalResult = await db.execute(sql`
    SELECT COUNT(*) as count, COALESCE(SUM(byte_length), 0) as total_size 
    FROM media_assets
  `);
  
  // Images utilisées
  const usedResult = await db.execute(sql`
    SELECT COUNT(DISTINCT m.id) as count
    FROM media_assets m
    WHERE m.id IN (
      SELECT logo_id FROM site_info WHERE logo_id IS NOT NULL
      UNION
      SELECT media_id FROM hero_slides WHERE media_id IS NOT NULL
      UNION
      SELECT image_id FROM dishes WHERE image_id IS NOT NULL
      UNION
      SELECT image_id FROM events WHERE image_id IS NOT NULL
      UNION
      SELECT media_id FROM gallery WHERE media_id IS NOT NULL
      UNION
      SELECT thumbnail_id FROM gallery WHERE thumbnail_id IS NOT NULL
      UNION
      SELECT client_photo_id FROM testimonials WHERE client_photo_id IS NOT NULL
    )
  `);

  // Images non utilisées et leur taille
  const unusedResult = await db.execute(sql`
    SELECT COUNT(*) as count, COALESCE(SUM(byte_length), 0) as unused_size
    FROM media_assets m
    WHERE m.id NOT IN (
      SELECT logo_id FROM site_info WHERE logo_id IS NOT NULL
      UNION
      SELECT media_id FROM hero_slides WHERE media_id IS NOT NULL
      UNION
      SELECT image_id FROM dishes WHERE image_id IS NOT NULL
      UNION
      SELECT image_id FROM events WHERE image_id IS NOT NULL
      UNION
      SELECT media_id FROM gallery WHERE media_id IS NOT NULL
      UNION
      SELECT thumbnail_id FROM gallery WHERE thumbnail_id IS NOT NULL
      UNION
      SELECT client_photo_id FROM testimonials WHERE client_photo_id IS NOT NULL
    )
  `);

  // Nombre de doublons
  const duplicatesResult = await db.execute(sql`
    SELECT COUNT(*) as duplicate_files
    FROM (
      SELECT filename
      FROM media_assets 
      GROUP BY filename 
      HAVING COUNT(*) > 1
    ) duplicates
  `);

  const total = Number(totalResult.rows[0]?.count || 0);
  const used = Number(usedResult.rows[0]?.count || 0);
  const unused = Number(unusedResult.rows[0]?.count || 0);
  const duplicates = Number(duplicatesResult.rows[0]?.duplicate_files || 0);
  const totalSize = Number(totalResult.rows[0]?.total_size || 0);
  const unusedSize = Number(unusedResult.rows[0]?.unused_size || 0);

  return {
    total,
    used,
    unused,
    duplicates,
    totalSize,
    unusedSize
  };
}