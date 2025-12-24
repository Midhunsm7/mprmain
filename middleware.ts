import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ===============================
     ✅ ALLOW PUBLIC / SYSTEM ROUTES
  =============================== */

  // Google OAuth (login + callback)
  if (pathname.startsWith("/api/google")) {
    return NextResponse.next();
  }

  // Vendor bill upload (already working)
  if (pathname.startsWith("/api/upload/vendor-bill")) {
    return NextResponse.next();
  }

  // ✅ HR DOCUMENT UPLOAD (THIS FIXES YOUR ISSUE)
  if (pathname.startsWith("/api/hr/documents/upload")) {
    return NextResponse.next();
  }

  /* ===============================
     🔒 OPTIONAL: allow other safe APIs
     (add here if needed later)
  =============================== */
  // if (pathname.startsWith("/api/public")) {
  //   return NextResponse.next();
  // }

  /* ===============================
     DEFAULT: allow request to continue
     (your existing auth/layout logic
      will handle page protection)
  =============================== */
  return NextResponse.next();
}

/* ===============================
   APPLY MIDDLEWARE TO EVERYTHING
   (but we manually allow above paths)
=============================== */
export const config = {
  matcher: ["/api/:path*"],
};
