import { NextRequest, NextResponse } from "next/server";
import { createToken, setSessionCookie } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload/db";
import { validateEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Authenticate via Payload's built-in auth
    const payload = await getPayloadClient();

    let result;
    try {
      result = await payload.login({
        collection: "users",
        data: { email, password },
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.user;
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create our own JWT token
    const token = await createToken({
      id: String(user.id),
      email: String(user.email),
      name: (user as any).name as string | null,
      role: (user as any).role as string,
    });

    // Save session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await payload.create({
      collection: "sessions",
      data: {
        user: String(user.id) as any,
        token,
        expiresAt: expiresAt.toISOString(),
      },
    });

    // Set cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: (user as any).name,
        role: (user as any).role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}