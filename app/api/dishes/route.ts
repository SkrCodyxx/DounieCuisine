import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isTakeout = searchParams.get("isTakeout");
    const isTakeoutBool = isTakeout === "1" || isTakeout === "true";

    // Build conditions
    const conditions = [eq(schema.dishes.isActive, 1)];
    if (isTakeoutBool) {
      conditions.push(eq(schema.dishes.isTakeout, 1));
    }

    const dishes = await db
      .select()
      .from(schema.dishes)
      .where(and(...conditions))
      .orderBy(schema.dishes.displayOrder);

    // Fetch variants for all dishes
    const dishIds = dishes.map((d) => d.id);
    const allVariants =
      dishIds.length > 0
        ? await db
            .select()
            .from(schema.dishVariantsNew)
            .where(eq(schema.dishVariantsNew.isActive, 1))
            .orderBy(schema.dishVariantsNew.displayOrder)
        : [];

    // Attach variants to their dishes
    const dishesWithVariants = dishes.map((dish) => ({
      ...dish,
      variants: allVariants.filter((v) => v.dishId === dish.id),
    }));

    return NextResponse.json(dishesWithVariants);
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json({ error: "Failed to fetch dishes" }, { status: 500 });
  }
}
