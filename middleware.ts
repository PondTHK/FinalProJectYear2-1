import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/navigation";

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

const publicPaths = [
  "/", // Landing page
  "/auth", // Login/Register page
  "/jobs", // Jobs page
  "/companies", // Public company profiles
  "/company-login", // Company login page
  "/company-register", // Company register page
  "/company-pending-approval", // Company pending approval page
  "/about", // About page
  "/contact", // Contact page
];

// เส้นทางที่เป็น static files 
const staticPaths = ["/_next", "/favicon.ico", "/images", "/videos", "/fonts", "/api", "/static", "/.well-known"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("Middleware checking:", pathname);

  // ข้าม static files และ API routes
  if (staticPaths.some((path) => pathname.startsWith(path))) {
    console.log("Static/API path - allowed");
    return NextResponse.next();
  }

  // 1. Run next-intl middleware first to handle locale redirection
  // This will redirect / to /en (or default locale) and handle /en/path
  const response = intlMiddleware(request);

  // If next-intl redirects, return the response immediately
  if (response.headers.get("Location")) {
    return response;
  }

  // 2. Extract locale and normalized path for auth checks
  // pathname might be /en/profile or /profile (if default locale is hidden, but we configured it to be shown usually)
  // Let's assume standard behavior: /en/profile -> locale=en, path=/profile

  let locale = routing.defaultLocale;
  let normalizedPath = pathname;

  const segments = pathname.split('/');
  // segments[0] is empty string because path starts with /
  const potentialLocale = segments[1];

  if (routing.locales.includes(potentialLocale as any)) {
    locale = potentialLocale;
    normalizedPath = '/' + segments.slice(2).join('/');
  }

  // Handle root path after locale stripping (e.g. /en -> /)
  if (normalizedPath === "") normalizedPath = "/";

  console.log(`Locale: ${locale}, Normalized Path: ${normalizedPath}`);

  const isPublicPath = publicPaths.includes(normalizedPath) || normalizedPath.startsWith("/companies/");

  // เช็ค cookie จาก Backend 
  const accessToken = request.cookies.get("act")?.value;
  const refreshToken = request.cookies.get("rft")?.value;
  const token = accessToken || refreshToken;

  if (token) {
    console.log(`Found token in cookies`);
  }

  if (!token) {
    console.log("No token found");
  }

  if (!token && !isPublicPath) {
    console.log(`Access denied to ${normalizedPath} - redirecting to /${locale}/auth`);
    const loginUrl = new URL(`/${locale}/auth`, request.url);
    loginUrl.searchParams.set("redirect", normalizedPath);
    return NextResponse.redirect(loginUrl);
  }

  // ถ้า มี token แต่จะเข้า auth ให้รีไดเร็กตาม role
  if (token && normalizedPath === "/auth") {
    const userRole = request.cookies.get("user_role")?.value;
    console.log(`Already logged in with role: ${userRole}`);

    if (userRole === "CompanyUser") {
      console.log("CompanyUser - redirecting to /company-public-profile");
      return NextResponse.redirect(new URL(`/${locale}/company-public-profile`, request.url));
    }

    // ถ้าเป็น PersonaUser หรือ Admin (ต้องเช็คว่ามี role จริงๆ) ให้ไป profile
    if (userRole === "PersonaUser" || userRole === "Admin") {
      console.log("PersonaUser/Admin - redirecting to /profile");
      return NextResponse.redirect(new URL(`/${locale}/profile`, request.url));
    }

    // ถ้าไม่มี user_role cookie ให้ allow access เพื่อให้ auth page จัดการเอง
    console.log("No user_role cookie - allowing access to /auth");
  }

  // ถ้า มี token แต่จะเข้า company-login ให้รีไดเร็กตาม role
  if (token && normalizedPath === "/company-login") {
    const userRole = request.cookies.get("user_role")?.value;
    console.log(`Already logged in with role: ${userRole}`);

    if (userRole === "CompanyUser") {
      console.log("CompanyUser - redirecting to /company-public-profile");
      return NextResponse.redirect(new URL(`/${locale}/company-public-profile`, request.url));
    }

    // ถ้าเป็น PersonaUser (ต้องเช็คว่ามี role จริงๆ) พยายามเข้า company-login ให้ไปที่ profile
    if (userRole === "PersonaUser" || userRole === "Admin") {
      console.log("PersonaUser/Admin - redirecting to /profile");
      return NextResponse.redirect(new URL(`/${locale}/profile`, request.url));
    }

    // ถ้าไม่มี user_role cookie ให้ allow access
    console.log("No user_role cookie - allowing access to /company-login");
  }

  // ป้องกัน CompanyUser เข้าหน้า /profile (หน้า profile ของ user ทั่วไป)
  // แก้ไข: ให้เข้า /profile/[id] ได้ แต่เข้า /profile เฉยๆ ไม่ได้
  if (token && normalizedPath === "/profile") {
    const userRole = request.cookies.get("user_role")?.value;
    console.log(`Profile page access check - role: ${userRole}`);

    if (userRole === "CompanyUser") {
      console.log("CompanyUser trying to access /profile - redirecting to /company-public-profile");
      return NextResponse.redirect(new URL(`/${locale}/company-public-profile`, request.url));
    }
  }

  // ป้องกัน PersonaUser เข้าหน้า company pages
  if (token && (normalizedPath === "/company-public-profile" || normalizedPath === "/company-profile")) {
    const userRole = request.cookies.get("user_role")?.value;
    console.log(`Company page access check - role: ${userRole}`);

    if (userRole && userRole !== "CompanyUser") {
      console.log("PersonaUser trying to access company page - redirecting to /profile");
      return NextResponse.redirect(new URL(`/${locale}/profile`, request.url));
    }
  }

  console.log(" Access allowed");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
