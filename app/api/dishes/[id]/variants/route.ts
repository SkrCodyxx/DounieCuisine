import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json([]);
  try {
    const { id } = await params;
    const dishId = parseInt(id);

    const variants = await db
      .select()
      .from(schema.dishVariantsNew)
      .where(and(eq(schema.dishVariantsNew.dishId, dishId), eq(schema.dishVariantsNew.isActive, 1)))
      .orderBy(schema.dishVariantsNew.displayOrder);

    return NextResponse.json(variants);
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json([]);
  }
}
