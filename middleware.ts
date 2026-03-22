import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = new Set(["/", "/nosotros", "/contactenos", "/productos"]);
const PUBLIC_PREFIXES = ["/account"];
const PRIVATE_PREFIXES = ["/user"];
const PUBLIC_FILE = /\.(?:js|css|json|svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$/i;

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const normalizedPath = normalizePath(pathname);

  if (
    PUBLIC_PATHS.has(normalizedPath) ||
    PUBLIC_PREFIXES.some(prefix => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next();
  }

  const isPrivate = PRIVATE_PREFIXES.some(prefix => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));

  if (isPrivate) {
    const authenticated = await hasValidSession(req);
    if (authenticated) {
      return NextResponse.next();
    }

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/account/login";
    redirectUrl.searchParams.set("redirect_to", pathname);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
