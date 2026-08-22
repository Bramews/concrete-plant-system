import { NextResponse } from "next/server";
import { runSecurityChecks, applySecurityHeaders } from "./security";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { extractSubdomain } from "./lib/subdomain";
import { rateLimit } from "./lib/rate-limit";

type JWTPayload = {
  userId: number;
  role: string;
  companyId?: number;
};

/**
 * Verifies a JWT token using the configured JWT_SECRET.
 * Returns the payload if valid, null if invalid or expired.
 * Also supports mock base64 tokens for unit tests and local impersonation.
 */
async function verifyJWT(token: string): Promise<JWTPayload | null> {
  // Try real JWT verification using jose
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn(
        "[PROXY] JWT_SECRET is not configured. Real JWT verification skipped.",
      );
      return null;
    }
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

async function originalProxy(request: NextRequest) {
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
    pathname.startsWith("/api/governance/check") || // Bypass internal governance fetch to prevent deadlock
    pathname.startsWith("/api/network/check-access") || // Bypass internal network check-access fetch to prevent deadlock
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1.2 Governance Checks (Lockdown & Scoped Tunnel)
  const isAssetOrAuth =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/governance/check") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/admin/lockdown-confirm") ||
    request.headers.has("next-action") || // Bypass Server Actions to prevent deadlock
    pathname.includes(".");

  const isDevMode = process.env.NODE_ENV === "development";

  if (!isAssetOrAuth && !isDevMode) {
    try {
      const govRes = await fetch(
        new URL("/api/governance/check", request.url).href,
      );
      if (govRes.ok) {
        const { isLockdown, scope } = await govRes.json();

        // A. Handle Lockdown
        if (isLockdown) {
          return NextResponse.redirect(
            new URL("/admin/lockdown-confirm", request.url),
          );
        }

        // B. Handle Scoped Tunnel Mode
        const forwardedHost = request.headers.get("x-forwarded-host") || "";
        const isTunnel = forwardedHost.includes(".trycloudflare.com");
        if (
          isTunnel &&
          scope &&
          scope.startsWith("CUSTOMER:") &&
          !pathname.startsWith("/invite/")
        ) {
          const customerId = scope.split(":")[1];
          const targetPath = `/public/customer/${customerId}/dashboard`;
          if (pathname !== targetPath && !pathname.startsWith("/api/")) {
            return NextResponse.redirect(new URL(targetPath, request.url));
          }
        }
      }
    } catch (err) {
      console.error("[PROXY] Governance check failed:", err);
    }
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
  const PUBLIC_PATHS = new Set([
    "/access-denied",
    "/invite",
    "/system/tv",
    "/public/portal",
  ]);
  const isPublicPath =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/system/tv") ||
    pathname.startsWith("/public/portal");

  // 3. Bypass for Public Paths
  if (isPublicPath) {
    const hasGuestAccess =
      request.nextUrl.searchParams.has("guest_token") ||
      request.cookies.has("guest_token");
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url", request.url);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-real-ip", ip);

    if (!hasGuestAccess) {
      // مسار عام بدون رمز ضيف — تمرير مباشر بدون فحص الشبكة
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // مسار عام مع رمز ضيف (مثل /system/tv?guest_token=xxx)
    // نُمرر مباشرة لفحص الشبكة في الخطوة 8 لكن نتخطى حارس الحماية JWT في الخطوة 7
    // لذلك نضع علامة خاصة في الهيدر
    requestHeaders.set("x-guest-bypass", "true");
  }

  // 4. Extract Subdomain
  const subdomain = extractSubdomain(host);

  // 5. Auth Payload (Only fetch if needed)
  const accessToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("session_token")?.value;
  let payload: JWTPayload | null = null;

  // 6. Enforce subdomain for protected routes (Skip for localhost)
  const isProtectedRoute =
    pathname.startsWith("/system") || pathname.startsWith("/dashboard");
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  // هل هذا ضيف يدخل عبر رابط مؤقت للتلفزيون أو البوابة العامة؟
  const isGuestTvAccess =
    (pathname.startsWith("/system/tv") ||
      pathname.startsWith("/public/portal")) &&
    (request.nextUrl.searchParams.has("guest_token") ||
      request.cookies.has("guest_token"));

  if (isProtectedRoute && !isGuestTvAccess) {
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

  // 8. Network Access Hub Checks
  const isNetworkBypassed =
    pathname.startsWith("/api/network/check-access") ||
    pathname.startsWith("/access-denied") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    request.headers.has("next-action") || // Bypass Server Actions to prevent deadlock
    pathname.includes(".");

  let deviceUuid = request.cookies.get("device_uuid")?.value;
  let didCreateDeviceUuid = false;
  if (!deviceUuid && !isNetworkBypassed) {
    deviceUuid = crypto.randomUUID();
    didCreateDeviceUuid = true;
  }

  if (!isNetworkBypassed && deviceUuid && !isDevMode) {
    const guestToken =
      request.nextUrl.searchParams.get("guest_token") ||
      request.cookies.get("guest_token")?.value;
    try {
      const checkRes = await fetch(
        new URL("/api/network/check-access", request.url).href,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceUuid,
            companyId: payload?.companyId || null,
            host,
            pathname,
            guestToken,
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") || "",
            userId: payload?.userId || null,
            locationCountry:
              request.headers.get("cf-ipcountry") ||
              request.headers.get("x-device-country") ||
              null,
          }),
        },
      );

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.allowed) {
          const url = new URL("/access-denied", request.url);
          url.searchParams.set(
            "reason",
            checkData.reasonAr || "غير مصرح بالوصول للشبكة.",
          );
          const redirectResponse = NextResponse.redirect(url);
          if (didCreateDeviceUuid) {
            redirectResponse.cookies.set("device_uuid", deviceUuid, {
              maxAge: 60 * 60 * 24 * 365 * 10,
              path: "/",
            });
          }
          return redirectResponse;
        }
      }
    } catch (err) {
      console.error("Proxy check-access fetch error:", err);
    }
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
    if ((pathname === "/" || pathname === "/login") && sessionToken) {
      if (!request.nextUrl.searchParams.has("error")) {
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
          SALES_REP: "/system/sales",
          SALES_MANAGER: "/system/sales",
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
    }

    // System route isolation
    if (pathname.startsWith("/system")) {
      if (role !== "SYSTEM_OWNER") {
        const segments = pathname.split("/");
        const systemModule = segments[2];

        // ─── استخدام مصدر الحقيقة الموحد ───
        const { canAccessSector } = await import("@/lib/permissions");
        if (!canAccessSector(role, systemModule)) {
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

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (didCreateDeviceUuid && deviceUuid) {
    finalResponse.cookies.set("device_uuid", deviceUuid, {
      maxAge: 60 * 60 * 24 * 365 * 10,
      path: "/",
    });
  }

  return finalResponse;
}

export async function proxy(request: NextRequest) {
  const securityRes = runSecurityChecks(request);
  if (securityRes) return securityRes;

  const res = await originalProxy(request);
  applySecurityHeaders(res, request);

  // إخفاء معلومات التقنية وإضافة رأس الملكية
  res.headers.delete("X-Powered-By");
  res.headers.set("X-System", "CPS-Protected");
  res.headers.set("Server", ""); // إخفاء اسم الـ Server

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
