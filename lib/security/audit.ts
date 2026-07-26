import { prisma } from "../prisma";

// Role is now a string since we use Role as a model, not an enum

export async function logAuditEvent({
  userId,
  action,
  role,
  entity,
  entityId,
  prevStatus,
  newStatus,
  details,
}: {
  userId: number;
  action: string;
  role: string;
  entity: string;
  entityId: string | number;
  prevStatus?: string;
  newStatus?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        role,
        entity,
        entityId: String(entityId),
        prevStatus,
        newStatus,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

export async function logAuthFailure(
  userId: number,
  role: string,
  details: string,
) {
  return logAuditEvent({
    userId,
    action: "ACCESS_DENIED",
    role,
    entity: "SECURITY",
    entityId: 0, // System-wide identifier
    details,
  });
}

export async function logSessionEvent(
  userId: number,
  role: string,
  action: "LOGIN" | "LOGOUT" | "TOKEN_REFRESH",
  details?: string,
) {
  return logAuditEvent({
    userId,
    action,
    role,
    entity: "SESSION",
    entityId: userId,
    details,
  });
}
