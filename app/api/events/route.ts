import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { asc, sql } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const events = await db.query.events.findMany({
      where: sql`${schema.events.activityDate} >= CURRENT_DATE`,
      orderBy: [asc(schema.events.activityDate)],
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
