import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dishId = parseInt(id);

    // Get dish-side relations
    const dishSides = await db
      .select({
        dishSide: schema.dishSides,
        side: schema.sides,
      })
      .from(schema.dishSides)
      .innerJoin(schema.sides, eq(schema.dishSides.sideId, schema.sides.id))
      .where(and(eq(schema.dishSides.dishId, dishId), eq(schema.sides.isActive, 1)))
      .orderBy(schema.dishSides.displayOrder);

    const sides = dishSides.map(({ dishSide, side }) => ({
      ...side,
      isIncluded: dishSide.isIncluded,
      extraPrice: dishSide.extraPrice,
    }));

    return NextResponse.json(sides);
  } catch (error) {
    console.error("Error fetching sides:", error);
    return NextResponse.json({ error: "Failed to fetch sides" }, { status: 500 });
  }
}
