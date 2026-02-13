import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestBody = {
      ...body,
      inquiryType: body.inquiryType || "general",
    };

    const validated = schema.insertContactMessageSchema.parse(requestBody);

    const [contactMessage] = await db
      .insert(schema.contactMessages)
      .values({
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        subject: validated.subject || null,
        message: validated.message,
        inquiryType: validated.inquiryType || "general",
        status: "new",
      })
      .returning();

    return NextResponse.json(
      { message: "Message sent successfully", contactMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
