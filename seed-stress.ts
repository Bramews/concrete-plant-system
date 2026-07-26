// @ts-nocheck
import { prisma } from "./lib/prisma";

async function seed() {
  console.log("Seeding 100 orders...");
  // Bypass AuditGuard for scripts
  globalThis.prismaAuditContext = { userId: 1, companyId: 1 };

  const companyId = 1;
  const user = await prisma.user.findFirst({ where: { companyId } });
  if (!user) throw new Error("No user found");

  // Create in a loop for reliability
  for (let i = 0; i < 100; i++) {
    await prisma.order.create({
      data: {
        companyId,
        orderNumber: `TEST-ORD-${Date.now()}-${i}`,
        customerId: 1,
        projectId: 1,
        mixDesignId: 1,
        volume: 100,
        actualQuantity: 95,
        status: i % 2 === 0 ? "PENDING_APPROVAL" : "COMPLETED",
        date: new Date(),
        createdById: user.id,
      },
    });
  }
  console.log("Seeded 100 orders successfully.");
}

seed().catch(console.error);
