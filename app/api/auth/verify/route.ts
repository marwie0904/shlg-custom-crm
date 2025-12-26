import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Verify the email in Convex
    const result = await convex.mutation(api.auth.verifyEmail, { token });

    if (!result.success) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    // Get the updated user
    const user = await convex.query(api.users.getById, { id: result.userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create a new session token with updated emailVerified status
    const sessionToken = await createSessionToken({
      userId: user._id,
      email: user.email,
      role: user.role || "staff",
      mustChangePassword: user.mustChangePassword,
      emailVerified: true,
    });

    // Store session in Convex
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await convex.mutation(api.auth.createSession, {
      userId: user._id,
      token: sessionToken,
      expiresAt,
    });

    // Set the session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
