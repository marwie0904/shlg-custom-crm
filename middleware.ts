import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * AUTH BYPASS FOR DEVELOPMENT/DEMO
 * =================================
 * Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local to bypass all authentication.
 *
 * TO RESTORE AUTHENTICATION:
 * 1. Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local
 * 2. Or delete the variable entirely
 */
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/verify", "/api/auth", "/portal"];
// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
  exp: number;
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // BYPASS AUTH FOR MOCK DATA MODE
  if (USE_MOCK_DATA) {
    // Redirect login page to dashboard in mock mode
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;

  // Allow API routes to handle their own auth (except session which needs the cookie)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/session")) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Get session token from cookie
  const sessionToken = request.cookies.get("session")?.value;

  // If no session and not public route, redirect to login
  if (!sessionToken && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If we have a session, verify it
  if (sessionToken) {
    const session = await verifyToken(sessionToken);

    if (!session) {
      // Invalid session, clear cookie and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }

    // Check if session is expired
    if (session.exp * 1000 < Date.now()) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }

    // If user must change password and not on change-password page
    if (session.mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    // If email not verified and password has been changed, redirect to verify-pending
    if (
      !session.emailVerified &&
      !session.mustChangePassword &&
      pathname !== "/verify-pending" &&
      pathname !== "/verify" &&
      !pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL("/verify-pending", request.url));
    }

    // Check admin routes
    if (isAdminRoute && session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If on login page but already verified, redirect to dashboard
    if (pathname === "/login" && session.emailVerified && !session.mustChangePassword) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
