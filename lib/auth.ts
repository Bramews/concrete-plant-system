import { prisma } from "./prisma";
import { verifySession } from "./session";
import { cookies } from "next/headers";
import { normalizeRole } from "./roles";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { SystemRole, RoleName } from "@/lib/permissions";
export type { SystemRole, RoleName };

export type RoleType = SystemRole | string;

export interface ExtendedUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: RoleType; // derived from active membership
  status: "ACTIVE" | "DISABLED";
  companyId?: number | null;
  expiresAt?: Date | string | null;
}

export const getSession = cache(async function getSession() {
  // 1. Try to get session token from cookie
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside request context (e.g. CLI script), return null
    return null;
  }
  const token =
    cookieStore.get("session_token")?.value ||
    cookieStore.get("auth_token")?.value;

  if (!token) return null;

  // 2. Verify Session against DB (Kill Switch enforcement)
  let session = null;
  try {
    session = await verifySession(token);
  } catch {
    return null;
  }
  if (!session) return null;

  const user = session.user;
  if (!user) return null;

  // 3. Get Active Membership Role
  let activeRole: RoleType = "OPERATOR";

  // Check System Owner Status (Global Bypass)
  try {
    const systemOwner = await prisma.systemOwner.findFirst({
      where: { email: user.email },
    });

    if (systemOwner) {
      activeRole = "SYSTEM_OWNER";
    } else {
      // Try to find membership - first check if session has companyId
      const companyIdToUse = session.companyId || user.companyId;

      if (companyIdToUse) {
        const membership = await prisma.membership.findFirst({
          where: {
            userId: user.id,
            companyId: companyIdToUse,
            deletedAt: null,
          },
          include: { role: true },
        });

        if (membership && membership.role) {
          activeRole = normalizeRole(membership.role.name);
        }
      }
    }
  } catch (e) {
    console.error("[AUTH] Database error while fetching role:", e);
  }

  // 4. Resolve Company ID (Fallback from session to user)
  const resolvedCompanyId = session.companyId ?? user.companyId ?? undefined;

  // Return Session Object
  return {
    userId: user.id,
    role: activeRole,
    companyId: resolvedCompanyId,
    impersonatedBy: (session as Record<string, unknown>)
      .impersonatorSystemOwnerId as number | undefined,
    user: user,
  };
});

export async function getCurrentRole(): Promise<RoleType | null> {
  const session = await getSession();
  return session?.role || null;
}

export const getCurrentUser = cache(async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session) return null;

    let company = null;
    if (session.companyId) {
      try {
        company = await prisma.company.findUnique({
          where: { id: session.companyId },
        });
      } catch {
        company = null;
      }
    }

    // Ensure we return a consistent shape with a valid companyId
    return {
      id: session.userId,
      username: session.user.username,
      name: session.user.name,
      role: session.role,
      email: session.user.email,
      companyId: session.companyId,
      company,
    };
  } catch (err) {
    console.warn("[AUTH] getCurrentUser failed safely:", err);
    return null;
  }
});

export async function requireRole(allowedRoles: RoleType[]) {
  const session = await getSession();

  if (!session) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const userRole = session.role;

  if (userRole === "SYSTEM_OWNER") {
    return "SYSTEM_OWNER";
  }

  // Merge MANAGER and COMPANY_ADMIN roles dynamically so they function as a single role
  const expandedAllowedRoles = [...allowedRoles];
  if (
    expandedAllowedRoles.includes("MANAGER") &&
    !expandedAllowedRoles.includes("COMPANY_ADMIN")
  ) {
    expandedAllowedRoles.push("COMPANY_ADMIN");
  }
  if (
    expandedAllowedRoles.includes("COMPANY_ADMIN") &&
    !expandedAllowedRoles.includes("MANAGER")
  ) {
    expandedAllowedRoles.push("MANAGER");
  }

  if (!expandedAllowedRoles.includes(userRole)) {
    throw new Error(`UNAUTHORIZED:${userRole}`);
  }

  // Return session-like object for convenience in pages
  return session;
}

// Permissions Check
import { ROLE_DEFAULT_PERMISSIONS, PermissionType } from "@/lib/permissions";

export async function requirePermission(permission: PermissionType) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  if (session.role === "SYSTEM_OWNER") return true;

  try {
    const currentRole = await prisma.role.findFirst({
      where: { name: session.role, companyId: session.companyId ?? undefined },
    });

    if (currentRole) {
      const hasPerm = await prisma.rolePermission.findFirst({
        where: { roleId: currentRole.id, permissionId: permission },
      });
      if (hasPerm) return true;
    }

    // Check custom user permissions
    const customPermsSetting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId: session.userId, key: "CUSTOM_PERMS" } },
    });

    if (customPermsSetting && customPermsSetting.value) {
      try {
        const customPerms: string[] = JSON.parse(customPermsSetting.value);
        if (customPerms.includes(permission)) return true;
      } catch (e) {
        console.warn("Failed to parse custom permissions", e);
      }
    }
  } catch (e) {
    console.warn("Permission check error", e);
  }

  const staticPerms = ROLE_DEFAULT_PERMISSIONS[session.role as SystemRole];
  if (staticPerms?.includes(permission)) {
    return true;
  }

  redirect(
    `/access-denied?reason=${encodeURIComponent("Missing Permission: " + permission)}`,
  );
}
