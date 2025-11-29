import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// เส้นทางที่ไม่ต้อง login ก็เข้าได้ (Public Pages)
const publicPaths = [
  "/", // Landing page
  "/auth", // Login/Register page
  "/company-login", // Company login page
  "/company-register", // Company register page
  "/about", // About page
  "/contact", // Contact page
];

// เส้นทางที่เป็น static files (ให้ผ่านไปเลย)
const staticPaths = [
  "/_next",
  "/favicon.ico",
  "/images",
  "/videos",
  "/api",
  "/static",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug: แสดง path ที่กำลังเข้าถึง
  console.log("🔍 Middleware checking:", pathname);

  // ข้าม static files และ API routes
  if (staticPaths.some((path) => pathname.startsWith(path))) {
    console.log("✅ Static/API path - allowed");
    return NextResponse.next();
  }

  // ตรวจสอบว่าเป็นหน้าที่เข้าได้โดยไม่ต้อง login หรือไม่
  const isPublicPath = publicPaths.includes(pathname);

  // เช็ค cookie จาก Backend (act = access token, rft = refresh token)
  const accessToken = request.cookies.get("act")?.value;
  const refreshToken = request.cookies.get("rft")?.value;
  const token = accessToken || refreshToken;

  if (token) {
    console.log(`🔑 Found token in cookies`);
  }

  // Debug: แสดงสถานะ authentication
  if (!token) {
    console.log("❌ No token found");
  }

  // ถ้าไม่มี token และพยายามเข้าหน้าที่ต้อง login
  if (!token && !isPublicPath) {
    console.log(`🚫 Access denied to ${pathname} - redirecting to /auth`);
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ถ้ามี token แล้วพยายามเข้าหน้า auth
  // (ให้ redirect ไปหน้าหลักแทน)
  if (token && pathname === "/auth") {
    console.log("✅ Already logged in - redirecting to /profile");
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // อนุญาตให้เข้าได้
  console.log("✅ Access allowed");
  return NextResponse.next();
}

// กำหนด config ว่า middleware จะทำงานกับ path ไหนบ้าง
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
