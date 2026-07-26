/**
 * API PROTECTION LAYER
 * يحمي الـ API من الـ scraping والاستنساخ
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * تحقق من أن الطلب قادم من المتصفح وليس bot
 */
export function isSuspiciousRequest(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") || "";
  const accept = req.headers.get("accept") || "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // طلب API بدون Origin أو Referer = مشبوه (عدا الـ server-to-server)
  const hasNoOrigin = !origin && !referer;

  // UA فارغ = مشبوه
  const hasEmptyUA = ua.trim().length < 10;

  // Accept header يقبل فقط JSON (بدون html) من مصدر غير معروف = مشبوه
  const acceptsOnlyJson =
    accept.includes("application/json") &&
    !accept.includes("text/html") &&
    hasNoOrigin;

  return hasEmptyUA || (hasNoOrigin && acceptsOnlyJson);
}

/**
 * حماية API Route من الاستخدام غير المصرح به
 */
export async function protectApiRoute(
  req: NextRequest,
  options: {
    requireAuth?: boolean;
    allowedRoles?: string[];
    logAccess?: boolean;
  } = {},
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const { requireAuth = true } = options;

  // فحص suspicious request
  if (isSuspiciousRequest(req)) {
    return {
      allowed: false,
      response: new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  if (requireAuth) {
    const session = await getSession();
    if (!session) {
      return {
        allowed: false,
        response: new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      };
    }

    if (
      options.allowedRoles &&
      !options.allowedRoles.includes(session.role) &&
      session.role !== "SYSTEM_OWNER"
    ) {
      return {
        allowed: false,
        response: new NextResponse(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      };
    }
  }

  return { allowed: true };
}
