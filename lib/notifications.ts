import { prisma } from "./prisma";

export async function sendNotification({
  userId,
  type,
  message,
  correlationId,
}: {
  userId: number;
  type: "EMAIL" | "SYSTEM";
  message: string;
  correlationId?: string;
}) {
  console.log(`[NOTIFICATION][${type}] User ${userId}: ${message}`);

  await prisma.auditLog.create({
    data: {
      userId,
      role: "SYSTEM",
      action: `NOTIFICATION_SENT_${type}`,
      entity: "User",
      entityId: String(userId),
      details: message,
      correlationId,
    },
  });
}

export async function notifyAdmins(message: string, correlationId?: string) {
  const admins = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          role: {
            name: {
              in: ["SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"],
            },
          },
        },
      },
    },
  });

  for (const admin of admins) {
    await sendNotification({
      userId: admin.id,
      type: "SYSTEM",
      message,
      correlationId,
    });
  }
}
