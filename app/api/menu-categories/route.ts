import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const categories = await db
      .select()
      .from(schema.dishCategories)
      .where(eq(schema.dishCategories.isActive, 1))
      .orderBy(schema.dishCategories.displayOrder, schema.dishCategories.name);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
