import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  if (!db) return NextResponse.json([]);
  try {
    const photos = await db
      .select()
      .from(schema.gallery)
      .where(eq(schema.gallery.active, 1))
      .orderBy(schema.gallery.displayOrder);
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json([]);
  }
}
