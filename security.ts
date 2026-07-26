import { NextRequest, NextResponse } from "next/server";

// المسارات المحمية بصلاحيات
const PROTECTED_PREFIXES = [
  "/system",
  "/admin",
  "/api/lab",
  "/api/orders",
  "/api/manager",
  "/api/sales",
  "/api/accountant",
  "/api/operator",
];

// المسارات العامة
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/invite",
  "/api/auth",
  "/api/public",
  "/access-denied",
  "/_next",
  "/favicon.ico",
  "/public",
  "/track",
  "/verify",
  "/tickets",
  "/system/tv", // السماح بفتح البث الحي للضيوف دون توجيه لصفحة تسجيل الدخول
];

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const MAX_API_REQUESTS_PER_MIN = 120;
const apiRateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function runSecurityChecks(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // ── Rate Limiting على مسار Login ──
  if (pathname === "/login" || pathname === "/api/auth/login") {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (record) {
      if (now > record.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
      } else if (record.count >= MAX_LOGIN_ATTEMPTS) {
        return new NextResponse(
          JSON.stringify({
            error: "Too many login attempts. Try again in 15 minutes.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
            },
          },
        );
      } else {
        record.count++;
      }
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    }
  }

  // ── Rate Limiting عام على API ──
  if (pathname.startsWith("/api/")) {
    const now = Date.now();
    const key = `${ip}:api`;
    const record = apiRateMap.get(key);

    if (record) {
      if (now > record.resetAt) {
        apiRateMap.set(key, { count: 1, resetAt: now + 60000 });
      } else if (record.count >= MAX_API_REQUESTS_PER_MIN) {
        return new NextResponse(
          JSON.stringify({ error: "Rate limit exceeded." }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      } else {
        record.count++;
      }
    } else {
      apiRateMap.set(key, { count: 1, resetAt: now + 60000 });
    }
  }

  // ── منع الـ Scraping ──
  const userAgent = req.headers.get("user-agent") || "";
  const scrapingAgents = [
    "python-requests",
    "curl",
    "wget",
    "scrapy",
    "httpx",
    "axios",
    "java",
    "go-http",
    "libwww",
    "phantomjs",
    "headless",
  ];
  const isScraperUA = scrapingAgents.some((s) =>
    userAgent.toLowerCase().includes(s),
  );

  if (isScraperUA && isProtectedPath(pathname)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── حماية المسارات المحمية (تتطلب session_token) ──
  if (isProtectedPath(pathname) && !isPublicPath(pathname)) {
    const sessionToken = req.cookies.get("session_token")?.value;
    if (!sessionToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return null;
}

export function applySecurityHeaders(res: NextResponse, req: NextRequest) {
  const ip = getClientIp(req);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.headers.set("x-real-ip", ip);
  res.headers.set("x-url", req.url);
}
