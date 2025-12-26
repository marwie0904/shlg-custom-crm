import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
  try {
    const token = await getSessionCookie();

    if (token) {
      // Delete session from Convex
      await convex.mutation(api.auth.deleteSession, { token });
    }

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      redirectTo: "/login",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear the cookie even if there's an error
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      redirectTo: "/login",
    });
  }
}
