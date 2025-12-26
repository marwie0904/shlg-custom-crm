import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getSession,
  generateVerificationToken,
  getVerificationTokenExpiry,
} from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Check if this is an admin resending for a user
    const body = await request.json().catch(() => ({}));
    const { userId: targetUserId } = body;

    let userEmail: string;
    let userName: string;
    let userId: Id<"users">;

    if (targetUserId) {
      // Admin resending verification email for another user
      const session = await getSession();
      if (!session || session.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can resend verification emails for other users" },
          { status: 403 }
        );
      }

      const targetUser = await convex.query(api.users.getById, {
        id: targetUserId as Id<"users">,
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = targetUser._id;
      userEmail = targetUser.email;
      userName = targetUser.name;
    } else {
      // User resending for themselves
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }

      const user = await convex.query(api.auth.getUserByEmail, {
        email: session.email,
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = user._id;
      userEmail = user.email;
      userName = user.name;
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = getVerificationTokenExpiry();

    await convex.mutation(api.auth.setVerificationToken, {
      userId,
      token: verificationToken,
      expiresAt: verificationExpiry,
    });

    // Send verification email via Make.com
    if (!process.env.MAKE_VERIFICATION_EMAIL_WEBHOOK) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationLink = `${appUrl}/verify?token=${verificationToken}`;

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

    const response = await fetch(process.env.MAKE_VERIFICATION_EMAIL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userEmail,
        subject: "Verify Your Email - SHLF Intake CRM",
        htmlBody,
        userName,
        verificationLink,
      }),
    });

    if (!response.ok) {
      console.error("Make.com webhook failed:", await response.text());
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: "An error occurred while sending verification email" },
      { status: 500 }
    );
  }
}
