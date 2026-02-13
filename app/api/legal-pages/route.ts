import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const pages = await db
      .select()
      .from(schema.legalPages)
      .where(eq(schema.legalPages.active, 1))
      .orderBy(schema.legalPages.displayOrder);

    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching legal pages:", error);
    return NextResponse.json({ error: "Failed to fetch legal pages" }, { status: 500 });
  }
}
