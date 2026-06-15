import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = new Set(["/", "/nosotros", "/contactenos", "/productos"]);
const PUBLIC_PREFIXES = ["/account", "/checkout", "/user_account"];
const PRIVATE_PREFIXES = ["/user"];
const PUBLIC_FILE = /\.(?:js|css|json|svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$/i;

const PUBLIC_API_ROUTES = [
  { method: "POST", path: "/api/login" },
  { method: "POST", path: "/api/usuarios" },
  { method: "POST", path: "/api/solicitudes" },
  { method: "POST", path: "/api/stripe/webhook" },
];

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function isPublicApiRoute(method: string, pathname: string) {
  return PUBLIC_API_ROUTES.some(
    (route) => route.method === method && route.path === pathname
  );
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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const normalizedPath = normalizePath(pathname);

  if (normalizedPath.startsWith("/api")) {
    if (req.method === "OPTIONS" || isPublicApiRoute(req.method, normalizedPath)) {
      return NextResponse.next();
    }

    const authenticated = await hasValidSession(req);
    if (authenticated) {
      return NextResponse.next();
    }

    const response = NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
    response.cookies.delete("session");
    return response;
  }

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
    redirectUrl.pathname = "/user_account/login";
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
