import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSession } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get fresh user data from Convex
    const user = await convex.query(api.auth.getUserByEmail, {
      email: session.email,
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Check if user is suspended
    if (user.status === "suspended") {
      return NextResponse.json(
        { user: null, error: "Account suspended" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "staff",
        mustChangePassword: user.mustChangePassword,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
