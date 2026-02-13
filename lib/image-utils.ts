/**
 * Image URL utilities for Dounie Cuisine
 * All images are served via /api/media/:id from the media_assets table.
 * Properly typed - no "as any" casts.
 */

interface HasImageId {
  imageId?: number | null;
}

interface HasMediaId {
  mediaId?: number | null;
}

interface HasLogoId {
  logoId?: number | null;
}

interface HasClientPhotoId {
  clientPhotoId?: number | null;
}

interface HasCoverImageId {
  coverImageId?: number | null;
}

export function getImageUrl(item: HasImageId | number | null | undefined): string | null {
  if (item === null || item === undefined) return null;
  if (typeof item === "number") return item > 0 ? `/api/media/${item}` : null;
  if (!item.imageId) return null;
  return `/api/media/${item.imageId}`;
}

export function getLogoUrl(item: HasLogoId | null | undefined): string | null {
  if (!item?.logoId) return null;
  return `/api/media/${item.logoId}`;
}

export function getMediaUrl(item: HasMediaId | null | undefined): string | null {
  if (!item?.mediaId) return null;
  return `/api/media/${item.mediaId}`;
}

export function getClientPhotoUrl(item: HasClientPhotoId | null | undefined): string | null {
  if (!item?.clientPhotoId) return null;
  return `/api/media/${item.clientPhotoId}`;
}

export function getCoverImageUrl(item: HasCoverImageId | null | undefined): string | null {
  if (!item?.coverImageId) return null;
  return `/api/media/${item.coverImageId}`;
}

export function getMediaUrlById(id: number | null | undefined): string | null {
  if (!id) return null;
  return `/api/media/${id}`;
}

export function hasImage(item: HasImageId | null | undefined): boolean {
  return getImageUrl(item) !== null;
}
