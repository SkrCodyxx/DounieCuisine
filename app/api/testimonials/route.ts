import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const testimonials = await db
      .select()
      .from(schema.testimonials)
      .where(eq(schema.testimonials.approved, 1))
      .orderBy(schema.testimonials.displayOrder);

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.insertTestimonialSchema.parse(body);

    const clientName = validated.clientName || validated.name;
    const [testimonial] = await db
      .insert(schema.testimonials)
      .values({
        ...validated,
        clientName: clientName || "Anonymous",
        approved: 0,
      })
      .returning();

    return NextResponse.json(
      { message: "Testimonial submitted for review", testimonial },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json({ error: "Failed to submit testimonial" }, { status: 500 });
  }
}
