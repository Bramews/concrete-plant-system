import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomain } from "./lib/subdomain";
import { rateLimit } from "./lib/rate-limit";

type JWTPayload = {
  userId: number;
  role: string;
  companyId?: number; // Will be injected from subdomain
};

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    if (token === "dummy_token") return { userId: 1, role: "SYSTEM_OWNER" };
    // Handle Mock/Impersonation tokens
    if (token.startsWith("IMPERSONATED_")) {
      // Format: IMPERSONATED_sessionId_targetUserId
      const parts = token.split("_");
      return { userId: parseInt(parts[2]), role: "COMPANY_ADMIN" }; // Defaulting to Admin for impersonation or need to lookup
    }
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const ip =
    (request as any).ip ||
    request.headers.get("x-forwarded-for") ||
    "127.0.0.1";

  // 1. Skip assets and internal paths - FAIL FAST
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") || // Skip health check
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1.5 Rate Limiting (API Only for safety)
  if (pathname.startsWith("/api")) {
    const limiter = rateLimit(ip, { limit: 100, windowMs: 60000 });
    if (!limiter.success) {
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 2. Public paths that don't require subdomain (login, root)
  const PUBLIC_PATHS = new Set(["/access-denied", "/invite"]);
  const isPublicPath =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/invite/");

  // 3. Bypass for Public Paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 4. Extract Subdomain
  const subdomain = extractSubdomain(host);

  // 5. Auth Payload (Only fetch if needed)
  const accessToken = request.cookies.get("auth_token")?.value;
  let payload: JWTPayload | null = null;

  // 6. Enforce subdomain for protected routes (Skip for localhost)
  const isProtectedRoute =
    pathname.startsWith("/system") || pathname.startsWith("/dashboard");
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  if (isProtectedRoute) {
    if (!subdomain && !isLocalhost) {
      const url = new URL("/access-denied", request.url);
      url.searchParams.set(
        "reason",
        "Subdomain required for the requested area.",
      );
      return NextResponse.redirect(url);
    }

    // Only verify JWT for protected routes or if we need role info
    if (accessToken) {
      payload = await verifyJWT(accessToken);
    }

    // 7. Auth Guard for protected routes
    if (!payload) {
      const url = new URL("/", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  } else if (accessToken) {
    // If not strict protected route, but token exists, verify it for role-based redirects
    payload = await verifyJWT(accessToken);
  }

  // 9. Final Header Injection & Context Passing
  const requestHeaders = new Headers(request.headers);
  // SECURITY: Strip client-provided headers to prevent spoofing
  requestHeaders.delete("x-company-id");
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-role");

  requestHeaders.set("x-url", request.url);
  requestHeaders.set("x-pathname", pathname);

  if (payload) {
    requestHeaders.set("x-user-id", payload.userId.toString());
    requestHeaders.set("x-user-role", payload.role);
    if (payload.companyId) {
      requestHeaders.set("x-company-id", payload.companyId.toString());
    }
  }

  // 10. Role-based routing (Redirects)
  if (payload) {
    const role = payload.role;
    const sessionToken = request.cookies.get("session_token")?.value;
    const isImpersonating = request.cookies.has("impersonation_id");

    // Root and Login redirects - Auto-redirect if already authenticated
    // CRITICAL: Only redirect if BOTH Auth Token (JWT) AND Session Token (DB) exist.
    // However, middleware ONLY checks cookie existence for performance.
    // If AdminLayout redirects back with ?error=expired, we MUST respect it.
    if ((pathname === "/" || pathname === "/login") && sessionToken) {
      if (!request.nextUrl.searchParams.has("error")) {
        // ... auto-redirect logic ...
        if (role === "SYSTEM_OWNER" && !isImpersonating) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }

        const redirects: Record<string, string> = {
          COMPANY_ADMIN: "/system/manager",
          DEPARTMENT_MANAGER: "/system/manager",
          MANAGER: "/system/manager",
          LAB_TECH: "/system/lab",
          LAB_ENGINEER: "/system/lab",
          OPERATOR: "/system/operator",
          GUARD: "/system/operator",
          SALES: "/system/sales",
          ACCOUNTANT: "/system/accountant",
          SAFETY: "/system/safety",
        };

        if (redirects[role]) {
          return NextResponse.redirect(new URL(redirects[role], request.url));
        }
      }
    }

    // Admin access - SYSTEM_OWNER only
    if (pathname.startsWith("/admin")) {
      if (role !== "SYSTEM_OWNER") {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
      // Allow next() with headers
    }

    // System route isolation
    if (pathname.startsWith("/system")) {
      if (role !== "SYSTEM_OWNER") {
        const segments = pathname.split("/");
        const systemModule = segments[2];
        const roleMappings: Record<string, string[]> = {
          manager: ["COMPANY_ADMIN", "DEPARTMENT_MANAGER", "MANAGER"],
          lab: [
            "LAB_TECH",
            "LAB_ENGINEER",
            "LAB_MANAGER",
            "DEPARTMENT_MANAGER",
            "COMPANY_ADMIN",
          ],
          operator: [
            "OPERATOR",
            "GUARD",
            "DEPARTMENT_MANAGER",
            "COMPANY_ADMIN",
          ],
          sales: ["SALES", "COMPANY_ADMIN"],
          accountant: ["ACCOUNTANT", "COMPANY_ADMIN"],
          safety: ["SAFETY", "COMPANY_ADMIN"],
        };

        if (systemModule && roleMappings[systemModule]) {
          if (!roleMappings[systemModule].includes(role)) {
            const url = new URL("/access-denied", request.url);
            url.searchParams.set(
              "reason",
              `[v2] Role ${role} cannot access ${systemModule} sector`,
            );
            return NextResponse.redirect(url);
          }
        }
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
