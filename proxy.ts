import { auth } from "@/auth";

// Re-export Auth.js session checker as the Next.js 16 proxy function
export const proxy = auth;

export const config = {
  matcher: [
    // Protect everything except:
    // - Auth.js API routes (/api/auth/*)
    // - Next.js internals (_next/*)
    // - Static files (images, fonts, etc.)
    // - Localized public pages (/{lang}/login, /{lang}/check-email)
    "/((?!api/auth|_next/static|_next/image|favicon.ico|[a-z]{2}(?:-[a-z]{2})?/login|[a-z]{2}(?:-[a-z]{2})?/check-email).*)",
  ],
};
