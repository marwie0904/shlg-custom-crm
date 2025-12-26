import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { clearSessionCookie } from "@/lib/auth";

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

    // Clear any existing session - user must log in again
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. Please log in.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
