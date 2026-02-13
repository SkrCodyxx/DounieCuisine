import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  if (!db) return NextResponse.json([]);
  try {
    const slides = await db
      .select()
      .from(schema.heroSlides)
      .where(eq(schema.heroSlides.active, 1))
      .orderBy(schema.heroSlides.displayOrder);
    return NextResponse.json(slides);
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json([]);
  }
}
