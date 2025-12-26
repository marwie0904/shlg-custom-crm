import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await convex.query(api.auth.getUserByEmail, {
      email: email.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is suspended
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact an administrator." },
        { status: 403 }
      );
    }

    let isValidPassword = false;

    // Check if this is first login with temporary password
    if (user.temporaryPassword && password === user.temporaryPassword) {
      isValidPassword = true;
    } else if (user.passwordHash) {
      // Check against hashed password
      isValidPassword = await verifyPassword(password, user.passwordHash);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSessionToken({
      userId: user._id,
      email: user.email,
      role: user.role || "staff",
      mustChangePassword: user.mustChangePassword,
      emailVerified: user.emailVerified,
    });

    // Store session in Convex
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    await convex.mutation(api.auth.createSession, {
      userId: user._id,
      token,
      expiresAt,
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        emailVerified: user.emailVerified,
      },
      redirectTo: user.mustChangePassword ? "/change-password" : "/",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
