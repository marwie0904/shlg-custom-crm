import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  hashPassword,
  getSession,
  createSessionToken,
  setSessionCookie,
  generateVerificationToken,
  getVerificationTokenExpiry,
} from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password in Convex
    await convex.mutation(api.auth.updatePasswordHash, {
      userId: session.userId as Id<"users">,
      passwordHash,
    });

    // Generate verification token for email verification
    const verificationToken = generateVerificationToken();
    const verificationExpiry = getVerificationTokenExpiry();

    await convex.mutation(api.auth.setVerificationToken, {
      userId: session.userId as Id<"users">,
      token: verificationToken,
      expiresAt: verificationExpiry,
    });

    // Get user info for email
    const user = await convex.query(api.auth.getUserByEmail, {
      email: session.email,
    });

    // Send verification email via Make.com
    if (process.env.MAKE_VERIFICATION_EMAIL_WEBHOOK) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const verificationLink = `${appUrl}/verify?token=${verificationToken}`;
      const userName = user?.name || "User";

      // Build HTML email content
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 40px; text-align: center;">
    <h1 style="color: #1a365d; margin-bottom: 20px;">SHLF Intake CRM</h1>
    <p style="font-size: 16px; margin-bottom: 30px;">
      Hi ${userName},<br><br>
      Please click the button below to verify your email address for SHLF Intake CRM.
    </p>
    <a href="${verificationLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
      Verify Email Address
    </a>
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      This link will expire in 24 hours.<br>
      If you didn't request this, please ignore this email.
    </p>
  </div>
</body>
</html>
      `.trim();

      try {
        await fetch(process.env.MAKE_VERIFICATION_EMAIL_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: session.email,
            subject: "Verify Your Email - SHLF Intake CRM",
            htmlBody,
            userName,
            verificationLink,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail the password change if email fails
      }
    }

    // Create new session token with updated flags
    const newToken = await createSessionToken({
      userId: session.userId,
      email: session.email,
      role: session.role,
      mustChangePassword: false,
      emailVerified: false, // Still not verified until they click the link
    });

    // Update session in Convex
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await convex.mutation(api.auth.createSession, {
      userId: session.userId as Id<"users">,
      token: newToken,
      expiresAt,
    });

    // Set new session cookie
    await setSessionCookie(newToken);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Please check your email to verify your account.",
      redirectTo: "/verify-pending",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An error occurred while changing password" },
      { status: 500 }
    );
  }
}
