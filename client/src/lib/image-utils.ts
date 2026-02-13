/**
 * Helper functions pour gérer les URLs d'images
 * Système basé uniquement sur les uploads via media_assets (mediaId, logoId, imageId)
 */

/**
 * Interface pour les objets qui peuvent avoir une image
 */
interface HasImage {
  imageId?: number | null;
}

/**
 * Génère l'URL d'affichage pour une image uploadée
 * Retourne /api/media/:id si imageId existe, sinon null
 * Supporte à la fois camelCase (imageId) et snake_case (image_id)
 */
export function getImageUrl(item: HasImage | null | undefined): string | null {
  if (!item) return null;
  const imageId = item.imageId || (item as any).image_id;
  if (!imageId) return null;
  return `/api/media/${imageId}`;
}

/**
 * Génère l'URL d'affichage pour un logo uploadé
 * Supporte à la fois camelCase (logoId) et snake_case (logo_id)
 */
export function getLogoUrl(item: { logoId?: number | null; logo_id?: number | null } | null | undefined): string | null {
  if (!item) return null;
  const logoId = item.logoId || item.logo_id;
  if (!logoId) return null;
  return `/api/media/${logoId}`;
}

/**
 * Génère l'URL d'affichage pour un média uploadé (image ou vidéo)
 * Pour les hero slides et gallery
 * Supporte à la fois camelCase (mediaId) et snake_case (media_id)
 */
export function getMediaUrl(item: { mediaId?: number | null; media_id?: number | null } | null | undefined): string | null {
  if (!item) return null;
  const mediaId = item.mediaId || item.media_id;
  if (!mediaId) return null;
  return `/api/media/${mediaId}`;
}

/**
 * Vérifie si un objet a une image disponible
 */
export function hasImage(item: HasImage | null | undefined): boolean {
  return getImageUrl(item) !== null;
}
