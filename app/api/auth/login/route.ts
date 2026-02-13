import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "@/lib/schema";
import { signToken, getAuthCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, username))
      .limit(1);

    if (!user || !user.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await db
      .update(schema.adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(schema.adminUsers.id, user.id));

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieOpts = getAuthCookieOptions();
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
