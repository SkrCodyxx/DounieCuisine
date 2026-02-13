import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const [info] = await db
      .select()
      .from(schema.siteInfo)
      .limit(1);

    return NextResponse.json(info || null);
  } catch (error) {
    console.error("Error fetching site info:", error);
    return NextResponse.json({ error: "Failed to fetch site info" }, { status: 500 });
  }
}
