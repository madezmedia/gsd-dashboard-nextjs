import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk session gate for the dashboard UI and every API route.
 *
 * Next.js 16 runs this file as Proxy (the renamed middleware convention).
 * swarm-os was not available in this environment, so this follows Clerk's
 * App Router proxy pattern: public allowlist, everything else requires a session.
 *
 * Public pages are static offer pages that do not call fleet APIs.
 * API routes fail closed with 401 JSON instead of an HTML sign-in redirect.
 */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/assessment(.*)",
  "/coaching(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  const { userId } = await auth();
  if (userId) {
    return;
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless they show up in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Clerk Frontend API proxy path, if enabled later.
    "/__clerk/(.*)",
  ],
};
