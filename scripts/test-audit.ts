import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- 🛡️ TESTING AUDIT LOGGING ---");

  // We need to switch context to a specific user/company to test auditing
  // Since we can't easily inject headers in a script without the "MOCK_CONTEXT" hook we removed,
  // we will rely on the fact that our `lib/prisma.ts` logic falls back to "unknown" or manual args if no headers.

  // BUT wait, our audit logic in lib/prisma.ts attempts to read headers:
  // const userId = headersList?.get("x-user-id");
  // If headersList is undefined, these will be null.

  // To truly test the audit log population with USER ID, we might need that mock back?
  // OR we can manually inspect if the AuditLog is created with "SYSTEM" role (default fallback).

  console.log("1. Creating a test material...");
  const uniqueCode = `AUDIT-TEST-${Date.now()}`;

  // We need a valid companyId. Assuming 1 exists.
  try {
    const material = await prisma.material.create({
      data: {
        companyId: 1,
        name: `Audit Test Material ${uniqueCode}`,
        code: uniqueCode,
        status: "ACTIVE",
      },
    });
    console.log("✅ Material created:", material.id);

    // Verify Audit Log
    // AuditLog creation is async but awaited in the extension.
    const log = await prisma.auditLog.findFirst({
      where: {
        entity: "Material",
        entityId: String(material.id),
        action: "CREATE",
      },
      orderBy: { timestamp: "desc" },
    });

    if (log) {
      console.log("✅ Audit Log Found:", {
        action: log.action,
        entity: log.entity,
        newValue: log.newValue ? "Present (JSON)" : "Missing",
        role: log.role,
      });
    } else {
      console.error("❌ Audit Log NOT Found for CREATE operation!");
    }

    // 2. Update
    console.log("2. Updating material...");
    // STRICT GUARD requires companyId in where clause for scripts/no-context
    await prisma.material.update({
      where: { id: material.id, companyId: 1 },
      data: { status: "INACTIVE" },
    });

    const updateLog = await prisma.auditLog.findFirst({
      where: {
        entity: "Material",
        entityId: String(material.id),
        action: "UPDATE",
      },
      orderBy: { timestamp: "desc" },
    });

    if (updateLog) {
      console.log("✅ Audit Log Found (Update):", {
        action: updateLog.action,
        entity: updateLog.entity,
        oldValue: updateLog.oldValue ? "Present (JSON)" : "Missing",
        newValue: updateLog.newValue ? "Present (JSON)" : "Missing",
      });
    } else {
      console.error("❌ Audit Log NOT Found for UPDATE operation!");
    }

    // 3. Delete
    console.log("3. Deleting material...");
    await prisma.material.delete({
      where: { id: material.id, companyId: 1 },
    });
    const deleteLog = await prisma.auditLog.findFirst({
      where: {
        entity: "Material",
        entityId: String(material.id),
        action: "DELETE",
      },
      orderBy: { timestamp: "desc" },
    });
    if (deleteLog) {
      console.log("✅ Audit Log Found (Delete)");
    } else {
      console.error("❌ Audit Log NOT Found for DELETE operation!");
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

main();
