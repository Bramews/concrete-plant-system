"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, getSession } from "@/lib/auth";
import {
  startImpersonation,
  revokeSession,
  createSession,
  SESSION_COOKIE_NAME,
} from "@/lib/session";
import { cookies } from "next/headers";

// Get Audit Actor Helper
async function getAuditActor() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (session.impersonatedBy) {
    return {
      userId: undefined,
      systemOwnerId: session.impersonatedBy,
      role: "SYSTEM_OWNER",
    };
  }

  const isSystemOwner = session.role === "SYSTEM_OWNER";
  return {
    userId: isSystemOwner ? undefined : session.userId,
    systemOwnerId: isSystemOwner ? session.userId : undefined,
    role: session.role,
  };
}

export async function impersonateUser(targetUserId: number) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const actor = await getAuditActor(); // This should be the owner
    // actor.systemOwnerId MUST be present for impersonation to work as per our new model
    if (!actor.systemOwnerId) {
      return { error: "Only System Owners can impersonate." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) return { error: "User not found." };

    // Explicitly block impersonating system owners
    const isTargetOwner = await prisma.systemOwner.findUnique({
      where: { email: targetUser.email },
    });
    if (
      isTargetOwner ||
      targetUser.email === "ahmed@concrete.com" ||
      targetUser.email === "ahmed@neon.com"
    ) {
      return { error: "لا يمكن محاكاة حسابات مالك النظام سيادياً." };
    }

    // Start Impersonation Session (DB)
    const { token, impSessionId } = await startImpersonation(
      actor.systemOwnerId,
      targetUser.id,
      "Admin Impersonation", // Reason
    );

    // Set Session Cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    // Set flag for middleware/frontend to know we are observing
    cookieStore.set("impersonation_id", impSessionId, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    // Audit Log is handled inside startImpersonation?
    // Wait, startImpersonation creates `ImpersonationSession` record.
    // The requirement says "AuditLog Runtime - Any Request ... logs systemOwnerId".
    // But we also need an AuditLog for the *Start Action* itself?
    // startImpersonation creates `ImpersonationSession`. Does it create an `AuditLog` entry?
    // No. `lib/session.ts` only creates `ImpersonationSession`.
    // So we should keep the AuditLog here or add it.
    // The previous code had `prisma.auditLog.create`.
    // And duplicate logging? `ImpersonationSession` table IS a log of sessions.
    // But `AuditLog` table is the generic event log.
    // I will keep the explicit AuditLog creation here for completeness of the centralized log.

    // TODO: Fix type safety - Prisma client update pending validation
    await prisma.auditLog.create({
      data: {
        action: "IMPERSONATE_START",
        details: `Started impersonating user ${targetUser.email}. ImpersonationSessionID: ${impSessionId}`,
        entity: "User",
        entityId: String(targetUser.id),

        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role,
        timestamp: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Impersonate error:", error);
    return { error: "Failed to impersonate." };
  }
}

export async function stopImpersonation() {
  // Cannot use requireRole(["SYSTEM_OWNER"]) because we are impersonating!
  const session = await getSession();

  // session object now has impersonatedBy thanks to our lib/auth.ts change
  if (!session || !session.impersonatedBy) {
    return { error: "Not impersonating." };
  }

  try {
    const systemOwnerId = session.impersonatedBy; // check: lib/auth.ts returns number | undefined

    // Revoke the impersonation session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    // For now, let's look up the session by token again since we have the token
    if (token) {
      const dbSession = await prisma.session.findUnique({
        where: {
          tokenHash: (await import("@/lib/security/crypto")).sha256(token),
        },
      });
      if (dbSession) {
        await revokeSession(dbSession.id); // Mark as revoked
      }
    }

    // Restore Admin Session
    // We must find the User record corresponding to the SystemOwner
    const systemOwner = await prisma.systemOwner.findUnique({
      where: { id: systemOwnerId },
    });
    if (!systemOwner) return { error: "System Owner record not found" };

    const ownerUser = await prisma.user.findUnique({
      where: { email: systemOwner.email },
    });
    if (!ownerUser) return { error: "System Owner user record not found" };

    const { token: newToken } = await createSession(ownerUser.id);

    cookieStore.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    cookieStore.delete("impersonation_id");

    await prisma.auditLog.create({
      data: {
        action: "IMPERSONATE_STOP",
        details: `Stopped impersonating. Returned to admin ID ${systemOwnerId}.`,
        entity: "User",
        entityId: String(session.userId), // The user we were impersonating

        // Audit as the admin who stopped it
        systemOwnerId: systemOwnerId,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Stop impersonation error:", error);
    return { error: "Failed to stop impersonation." };
  }
}

export async function killUserSession(userId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const actor = await getAuditActor();

    // Check if target is a System Owner
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (targetUser) {
      const isTargetOwner = await prisma.systemOwner.findUnique({
        where: { email: targetUser.email },
      });
      if (
        isTargetOwner ||
        targetUser.email === "ahmed@concrete.com" ||
        targetUser.email === "ahmed@neon.com"
      ) {
        const session = await getSession();
        if (session?.userId !== userId) {
          return { error: "لا يمكن إنهاء جلسات مالك نظام آخر سيادياً." };
        }
      }
    }

    // Use proper kill switch
    await (await import("@/lib/session")).killUserSessions(userId);

    await prisma.auditLog.create({
      data: {
        action: "SESSION_KILL",
        details: `Killed sessions for user ${userId}`,
        entity: "User",
        entityId: String(userId),

        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Kill session error:", error);
    return { error: "Failed to kill session." };
  }
}

export async function suspendUser(userId: number) {
  await requireRole(["SYSTEM_OWNER"]);
  try {
    const actor = await getAuditActor();

    // Check if target is a System Owner
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (targetUser) {
      const isTargetOwner = await prisma.systemOwner.findUnique({
        where: { email: targetUser.email },
      });
      if (
        isTargetOwner ||
        targetUser.email === "ahmed@concrete.com" ||
        targetUser.email === "ahmed@neon.com"
      ) {
        return { error: "حساب مالك النظام محمي سيادياً ولا يمكن تعطيله." };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "DISABLED" },
    });

    // Kill session implies revoking database sessions
    await (await import("@/lib/session")).killUserSessions(userId);
    // Also clear refresh tokens if they exist (legacy/JWT)
    await prisma.refreshToken.deleteMany({ where: { userId } });

    await prisma.auditLog.create({
      data: {
        action: "USER_SUSPEND",
        details: `Suspended user ${user.email} and killed sessions.`,
        entity: "User",
        entityId: String(userId),

        userId: actor.userId,
        systemOwnerId: actor.systemOwnerId,
        role: actor.role,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Suspend user error:", error);
    return { error: "Failed to suspend user." };
  }
}
