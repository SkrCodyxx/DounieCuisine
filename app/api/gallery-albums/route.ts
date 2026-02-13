import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const albums = await db
      .select({
        id: schema.galleryAlbums.id,
        title: schema.galleryAlbums.title,
        description: schema.galleryAlbums.description,
        eventDate: schema.galleryAlbums.eventDate,
        location: schema.galleryAlbums.location,
        coverImageId: schema.galleryAlbums.coverImageId,
        category: schema.galleryAlbums.category,
        displayOrder: schema.galleryAlbums.displayOrder,
        isActive: schema.galleryAlbums.isActive,
        isFeatured: schema.galleryAlbums.isFeatured,
        createdAt: schema.galleryAlbums.createdAt,
        photoCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${schema.galleryPhotos} 
          WHERE ${schema.galleryPhotos.albumId} = ${schema.galleryAlbums.id} 
          AND ${schema.galleryPhotos.isActive} = 1
        )`,
      })
      .from(schema.galleryAlbums)
      .where(eq(schema.galleryAlbums.isActive, 1))
      .orderBy(desc(schema.galleryAlbums.isFeatured), schema.galleryAlbums.displayOrder);

    return NextResponse.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}
