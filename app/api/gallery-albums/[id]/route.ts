import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  try {
    const { id } = await params;
    const albumId = parseInt(id);

    const [album] = await db
      .select()
      .from(schema.galleryAlbums)
      .where(eq(schema.galleryAlbums.id, albumId))
      .limit(1);

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const photos = await db
      .select()
      .from(schema.galleryPhotos)
      .where(and(eq(schema.galleryPhotos.albumId, albumId), eq(schema.galleryPhotos.isActive, 1)))
      .orderBy(schema.galleryPhotos.displayOrder);

    return NextResponse.json({ ...album, photos });
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}
