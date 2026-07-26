import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/security/crypto";
import { v4 as uuidv4 } from "uuid";
import { getSystemSetting } from "@/lib/system-settings";

// Exported for Auth usage
export const SESSION_COOKIE_NAME = "session_token";

export type SessionPayload = {
  sessionId: string;
  userId: number;
  companyId?: number;
  impersonatorId?: number;
};

/**
 * Creates a new DB session for a user.
 * Returns the raw token (to be set in cookie) and the session object.
 */
export async function createSession(
  userId: number,
  companyId?: number,
  impersonatorSystemOwnerId?: number,
) {
  const token = uuidv4();
  const tokenHash = sha256(token);
  const expiresAt = new Date();

  const expiryDays = await getSystemSetting("SESSION_EXPIRY_DAYS", 7);
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const session = await prisma.session.create({
    data: {
      id: uuidv4(),
      userId,
      companyId,
      tokenHash,
      expiresAt,
      impersonatorSystemOwnerId,
    },
  });

  return { token, session };
}

/**
 * Verifies a session token against the DB.
 * Checks for expiration and revocation (Kill Switch).
 * Also enforces strictly: User Status, Membership Status.
 */
export async function verifySession(
  token: string,
): Promise<{
  id: string;
  userId: number;
  companyId: number | null;
  isRevoked: boolean;
  expiresAt: Date;
  impersonatorSystemOwnerId: number | null;
  user: {
    id: number;
    email: string;
    name: string;
    username: string;
    status: string;
    companyId: number | null;
  };
} | null> {
  const tokenHash = sha256(token);

  let session;
  try {
    session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  } catch (err: unknown) {
    // Log the error but don't throw - allow the app to continue with null session
    console.error("[verifySession] Database error:", (err as Error).message);
    return null;
  }

  if (!session) return null;
  if (session.isRevoked) {
    return null;
  }
  if (session.expiresAt < new Date()) {
    return null;
  }

  // 1. User Status Check
  if (session.user.status !== "ACTIVE") {
    // Optional: Auto-revoke invalid session?
    return null;
  }

  // 2. Membership Status Check (if company context exists)
  if (session.companyId) {
    // 🔱 استثناء مالك النظام — لا يحتاج لعضوية نشطة
    const isSystemOwner = await prisma.systemOwner.findFirst({
      where: { email: session.user.email },
    });

    if (!isSystemOwner) {
      try {
        const membership = await prisma.membership.findFirst({
          where: {
            userId: session.userId,
            companyId: session.companyId,
            deletedAt: null,
          },
        });

        if (!membership || membership.status !== "ACTIVE") {
          console.warn(
            `[verifySession] Invalid membership for user ${session.userId} in company ${session.companyId}`,
          );
          return null;
        }
      } catch (err: unknown) {
        console.error(
          "[verifySession] Membership check error:",
          (err as Error).message,
        );
        // Don't block access on membership check error if user is active
      }
    }
  }

  return session;
}

/**
 * Revokes a specific session (Log out).
 */
export async function revokeSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
}

/**
 * Revokes all sessions for a user (Kill Switch).
 */
export async function killUserSessions(userId: number) {
  await prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

/**
 * Revokes all sessions for a company (Emergency Lockdown).
 */
export async function killCompanySessions(companyId: number) {
  await prisma.session.updateMany({
    where: { companyId, isRevoked: false },
    data: { isRevoked: true },
  });
}

/**
 * Starts an impersonation session.
 * Logs the action and returns a specialized session context.
 */
export async function startImpersonation(
  systemOwnerId: number,
  targetUserId: number,
  reason: string,
) {
  // 1. Log the start
  const impSession = await prisma.impersonationSession.create({
    data: {
      id: uuidv4(),
      systemOwnerId,
      targetUserId,
      reason,
    },
  });

  // 2. Create a session for the target user linked to the impersonator
  // We don't set a default companyId, allowing the user flow to handle it or default logic elsewhere
  const { token, session } = await createSession(
    targetUserId,
    undefined,
    systemOwnerId,
  );

  return { token, session, impSessionId: impSession.id };
}
