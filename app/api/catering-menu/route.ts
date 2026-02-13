import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    // Get active categories
    const categories = await db
      .select()
      .from(schema.cateringCategories)
      .where(eq(schema.cateringCategories.isActive, 1))
      .orderBy(schema.cateringCategories.displayOrder);

    // Get items for each category
    const result = await Promise.all(
      categories.map(async (category) => {
        const items = await db
          .select()
          .from(schema.cateringItems)
          .where(eq(schema.cateringItems.categoryId, category.id))
          .orderBy(schema.cateringItems.displayOrder);

        // Get prices for each item
        const itemsWithPrices = await Promise.all(
          items.map(async (item) => {
            const prices = await db
              .select()
              .from(schema.cateringItemPrices)
              .where(eq(schema.cateringItemPrices.itemId, item.id))
              .orderBy(schema.cateringItemPrices.displayOrder);

            return { ...item, prices };
          })
        );

        return { ...category, items: itemsWithPrices };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching catering menu:", error);
    return NextResponse.json({ error: "Failed to fetch catering menu" }, { status: 500 });
  }
}
