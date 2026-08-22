import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/security/password";
import { createSession } from "@/lib/session";
import { signJWT } from "@/lib/security/jwt";
import { normalizeRole } from "@/lib/roles";
import { apiResponse } from "@/lib/api-gate";

/**
 * POST /api/auth/token
 * Exchange credentials for a stateless JWT token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return apiResponse.error("Username and password are required.", 400);
    }

    const rawInput = (username || "").trim();
    const cleanInput = rawInput.toLowerCase();

    const orConditions: any[] = [
      { username: rawInput },
      { username: cleanInput },
      { email: rawInput },
      { email: cleanInput },
    ];

    if (rawInput.includes("@")) {
      const parts = rawInput.split("@");
      if (parts.length === 2) {
        const [p1, p2] = parts;
        orConditions.push(
          { username: `${p1}@${p2}` },
          { username: `${p1.toLowerCase()}@${p2.toLowerCase()}` },
          { username: `${p1}@${p2.toLowerCase()}` },
          { username: `${p2}@${p1}` },
          { username: `${p2.toLowerCase()}@${p1.toLowerCase()}` },
          { username: `${p2}@${p1.toLowerCase()}` },
        );
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        company: true,
        memberships: {
          include: { role: true },
        },
      },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return apiResponse.error(
        "Invalid credentials.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    if (user.status === "DISABLED") {
      return apiResponse.error("Account disabled.", 403, "ACCOUNT_DISABLED");
    }

    // Determine Active Role
    const roles = user.memberships.map((m: any) => normalizeRole(m.role.name));
    let activeRole = "OPERATOR";
    const priority = [
      "SYSTEM_OWNER",
      "COMPANY_ADMIN",
      "DEPARTMENT_MANAGER",
      "MANAGER",
      "LAB_TECH",
      "SALES",
      "ACCOUNTANT",
    ];

    for (const p of priority) {
      if (roles.includes(p)) {
        activeRole = p;
        break;
      }
    }

    // Create DB Session (for audit/kill-switch)
    const { token: sessionToken } = await createSession(
      user.id,
      user.companyId ?? undefined,
    );

    // Generate JWT (Bearer Token)
    // Mobile apps usually need longer sessions. Default to 30 days for API.
    const maxAge = 60 * 60 * 24 * 30;
    const jwtPayload = {
      userId: user.id,
      role: activeRole,
      companyId: user.companyId ?? null,
      sessionId: sessionToken, // Link JWT to DB session
    };

    const token = await signJWT(jwtPayload, maxAge);

    return apiResponse.success({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: activeRole,
        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
              slug: user.company.slug,
            }
          : null,
      },
      expiresIn: maxAge,
    });
  } catch (error: unknown) {
    console.error("[API_AUTH] Login failure:", error);
    return apiResponse.error(
      "Internal server error during authentication.",
      500,
    );
  }
}
