import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 1. Session Management
export async function revokeSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
}

export async function revokeAllUserSessions(userId: number) {
  await prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

// 2. Device Tracking (Simple)
export async function trackDevice(
  userId: number,
  userAgent: string,
  ip: string,
) {
  // Since UserDevice model does not exist in schema, we log device registration to AuditLog
  const fingerprint = crypto
    .createHash("sha256")
    .update(`${userAgent}-${ip}`)
    .digest("base64");

  await prisma.auditLog.create({
    data: {
      userId,
      role: "USER",
      action: "DEVICE_TRACKED",
      entity: "Device",
      entityId: fingerprint.substring(0, 30),
      details: `User IP: ${ip}, User-Agent: ${userAgent}`,
    },
  });
}

// 3. Rate Limit Helper (Database Backed)
export async function checkRateLimit(
  companyId: number,
  limitType: "API" | "AUTH" = "API",
  limit: number = 100,
  windowSeconds = 60,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const count = await prisma.usageEvent.count({
    where: {
      companyId,
      metric: limitType,
      createdAt: { gte: windowStart },
    },
  });

  return count < limit;
}

// 4. Two Factor Helper (Cryptographically Secure)
export function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase(),
  );
}
