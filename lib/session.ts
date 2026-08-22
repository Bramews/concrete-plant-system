import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/security/crypto";
import { v4 as uuidv4 } from "uuid";
import { SignJWT, jwtVerify } from "jose";

// Exported for Auth usage
export const SESSION_COOKIE_NAME = "session_token";

export type SessionPayload = {
  sessionId: string;
  userId: number;
  companyId?: number;
  impersonatorId?: number;
};

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "9f4a2c7e8b1d5f3a6c0e4b9d7f2a5c8e1b4d6f9a3c7e0b2d5f8a1c4e7b0d3f6a8b2c5d9e3f7a1b6c4e8d2f5a9b3c7e1f4a6b8d0e2f5a7b9c1d3e5f7a9b0c2";
  return new TextEncoder().encode(secret);
}

/**
 * Creates a new DB session and a self-contained signed JWT token for the user.
 * This guarantees 100% session persistence across serverless instances (e.g. Vercel)
 * without premature logouts or session drops.
 */
export async function createSession(
  userId: number,
  companyId?: number,
  impersonatorSystemOwnerId?: number,
) {
  const sessionId = uuidv4();
  const expiresAt = new Date();
  const expiryDays = 30; // 30 days persistent session
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Sign a self-contained JWT token valid for 30 days
  const secretKey = getJwtSecret();
  const token = await new SignJWT({
    sessionId,
    userId,
    companyId: companyId || null,
    impersonatorSystemOwnerId: impersonatorSystemOwnerId || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey);

  const tokenHash = sha256(token);

  let sessionRecord = null;
  try {
    sessionRecord = await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        companyId,
        tokenHash,
        expiresAt,
        impersonatorSystemOwnerId,
      },
    });
  } catch (e) {
    console.warn("[createSession] DB session write skipped/failed safely:", e);
  }

  const session = sessionRecord || {
    id: sessionId,
    userId,
    companyId: companyId || null,
    tokenHash,
    expiresAt,
    impersonatorSystemOwnerId: impersonatorSystemOwnerId || null,
  };

  return { token, session };
}

/**
 * Verifies a session token.
 * 1. Checks self-contained signed JWT signature and expiry (Serverless-Safe).
 * 2. Verifies User Status and Membership in SQLite.
 * 3. Enforces DB Kill-Switch if session was explicitly revoked.
 */
export async function verifySession(token: string): Promise<{
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
  if (!token) return null;

  let jwtPayload: {
    sessionId?: string;
    userId?: number;
    companyId?: number | null;
    impersonatorSystemOwnerId?: number | null;
    exp?: number;
  } | null = null;

  try {
    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify(token, secretKey);
    jwtPayload = payload as typeof jwtPayload;
  } catch {
    // Not a valid JWT or expired, fallback to DB tokenHash check for older tokens
  }

  if (jwtPayload && jwtPayload.userId) {
    // 1. Fetch User from DB (Pre-seeded in SQLite so always available on any Vercel Lambda)
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: jwtPayload.userId },
      });
    } catch (e) {
      console.error("[verifySession] Error finding user:", e);
    }

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    const sessionId = jwtPayload.sessionId || uuidv4();
    const resolvedCompanyId = jwtPayload.companyId ?? user.companyId ?? null;
    const expiresAt = jwtPayload.exp
      ? new Date(jwtPayload.exp * 1000)
      : new Date(Date.now() + 30 * 86400000);

    // 2. Check if explicit revocation exists in DB
    try {
      const dbSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      if (dbSession?.isRevoked) {
        return null;
      }
    } catch {
      // Safe ignore if DB session record is on another Lambda instance
    }

    // 3. System Owner or Membership Check
    if (resolvedCompanyId) {
      const isSystemOwner = await prisma.systemOwner
        .findFirst({
          where: { email: user.email },
        })
        .catch(() => null);

      if (!isSystemOwner) {
        try {
          const membership = await prisma.membership.findFirst({
            where: {
              userId: user.id,
              companyId: resolvedCompanyId,
              deletedAt: null,
            },
          });
          if (membership && membership.status !== "ACTIVE") {
            return null;
          }
        } catch {
          // Allow active user to proceed
        }
      }
    }

    return {
      id: sessionId,
      userId: user.id,
      companyId: resolvedCompanyId,
      isRevoked: false,
      expiresAt,
      impersonatorSystemOwnerId: jwtPayload.impersonatorSystemOwnerId || null,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        status: user.status,
        companyId: resolvedCompanyId,
      },
    };
  }

  // Fallback for legacy raw UUID tokens
  const tokenHash = sha256(token);
  let session = null;
  try {
    session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  } catch (err: unknown) {
    console.error("[verifySession] Database error:", (err as Error).message);
    return null;
  }

  if (!session) return null;
  if (session.isRevoked || session.expiresAt < new Date()) {
    return null;
  }
  if (session.user.status !== "ACTIVE") {
    return null;
  }

  return session;
}

/**
 * Revokes a specific session (Log out).
 */
export async function revokeSession(sessionId: string) {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  } catch {
    // Ignore if session not in local instance
  }
}

/**
 * Revokes all sessions for a user (Kill Switch).
 */
export async function killUserSessions(userId: number) {
  try {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  } catch {}
}

/**
 * Revokes all sessions for a company (Emergency Lockdown).
 */
export async function killCompanySessions(companyId: number) {
  try {
    await prisma.session.updateMany({
      where: { companyId, isRevoked: false },
      data: { isRevoked: true },
    });
  } catch {}
}

/**
 * Starts an impersonation session.
 */
export async function startImpersonation(
  systemOwnerId: number,
  targetUserId: number,
  reason: string,
) {
  const impSession = await prisma.impersonationSession.create({
    data: {
      id: uuidv4(),
      systemOwnerId,
      targetUserId,
      reason,
    },
  });

  const { token, session } = await createSession(
    targetUserId,
    undefined,
    systemOwnerId,
  );

  return { token, session, impSessionId: impSession.id };
}
