import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- 🔍 DEBUG ROLE AUDIT ---");
  try {
    const uniqueRole = `DEBUG-ROLE-${Date.now()}`;
    const role = await prisma.role.create({
      data: {
        name: uniqueRole,
        companyId: 1,
        description: "Debug Role",
      },
    });

    console.log(`Created Role ${role.id}`);

    // Update with matching companyId context (simulated via args in strict mode)
    // Note: In script, we don't have capturing context (companyId is null in lib/prisma.ts)
    // UNLESS we are in the "Context Missing" block.
    // Wait, if companyId is null (Script Mode), then `fetchArgs` uses `queryArgs.where`.
    // `queryArgs.where` has `companyId: 1`.
    // So `findFirst` should work.

    await prisma.role.update({
      where: { id: role.id, companyId: 1 },
      data: { description: "Updated" },
    });

    const log = await prisma.auditLog.findFirst({
      where: { entity: "Role", entityId: String(role.id), action: "UPDATE" },
      orderBy: { timestamp: "desc" },
    });

    if (log) {
      console.log("Log Found:", {
        old: log.oldValue ? "YES" : "NO",
        new: log.newValue ? "YES" : "NO",
      });
      if (!log.oldValue) console.log("❌ Old Value Missing!");
    } else {
      console.log("❌ Log Missing");
    }

    await prisma.role.delete({ where: { id: role.id, companyId: 1 } });
  } catch (e) {
    console.error(e);
  }
}

main();
