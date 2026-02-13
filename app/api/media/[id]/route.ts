import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  try {
    const { id } = await params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const [media] = await db
      .select()
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.id, mediaId))
      .limit(1);

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.externalUrl) {
      return NextResponse.redirect(media.externalUrl);
    }

    if (media.data) {
      const base64Data = media.data.includes(",") ? media.data.split(",")[1] : media.data;
      const buffer = Buffer.from(base64Data, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": media.mimeType || "image/jpeg",
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return NextResponse.json({ error: "Media data not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}
