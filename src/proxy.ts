import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const activeOrgId = request.cookies.get("activeOrganizationId")?.value;

  const isOnboardingPage = pathname.startsWith("/onboarding");

  // Scenario 1: User is on the onboarding page
  if (isOnboardingPage) {
    // If they have an organization, redirect to the homepage
    if (activeOrgId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Otherwise, let them access the onboarding page
    return NextResponse.next();
  }

  // Scenario 2: User is on any other page
  // If they do NOT have an organization, redirect to onboarding
  if (!activeOrgId) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Otherwise, let them access the requested page
  return NextResponse.next();
}

export const config = {
  // Match all paths except for static files, images, and API routes.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.svg|favicon.ico).*)"],
};
