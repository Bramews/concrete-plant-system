import { prisma } from "../lib/prisma";

async function checkSchema() {
  console.log("🔍 Checking Database Schema for Phase 2 Fields...");

  try {
    // Check AuditLog for correlationId
    const auditLogFields = await prisma.$queryRaw`PRAGMA table_info(AuditLog)`;
    console.log("AuditLog Fields:", auditLogFields);

    // Check Order for originalQuantity
    const orderFields = await prisma.$queryRaw`PRAGMA table_info(Order)`;
    console.log("Order Fields:", orderFields);

    // Check for ResourceLock table
    const tables =
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log("Existing Tables:", tables);
  } catch (e: any) {
    console.error("❌ Failed to query schema:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
