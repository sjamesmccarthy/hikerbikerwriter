import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if it's a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/user/profile");

  // If accessing protected route and not authenticated
  if (isProtectedRoute && !token) {
    // Store the current URL to redirect back after login
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    const signInUrl = new URL(
      `/auth/signin?callbackUrl=${callbackUrl}`,
      request.url
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}
