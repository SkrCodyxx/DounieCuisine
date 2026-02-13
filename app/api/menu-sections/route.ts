import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const sections = await db
      .select()
      .from(schema.menuSections)
      .where(eq(schema.menuSections.isActive, 1))
      .orderBy(schema.menuSections.displayOrder);

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching menu sections:", error);
    return NextResponse.json({ error: "Failed to fetch menu sections" }, { status: 500 });
  }
}
