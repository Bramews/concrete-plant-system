import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- 🔍 DEBUG ROLE AUDIT 2 ---");
  try {
    const uniqueRole = `DEBUG-ROLE-2-${Date.now()}`;
    const role = await prisma.role.create({
      data: {
        name: uniqueRole,
        companyId: 1,
        description: "Debug Role 2",
      },
    });
    console.log(`Created Role ${role.id}`);

    // Explicit FindFirst Check
    const check = await prisma.role.findFirst({
      where: { id: role.id, companyId: 1 },
    });
    console.log("Explicit FindFirst Result:", check ? "FOUND" : "NOT FOUND");

    // Update
    await prisma.role.update({
      where: { id: role.id, companyId: 1 },
      data: { description: "Updated 2" },
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
      if (log.oldValue) console.log("Old Value:", log.oldValue);
    } else {
      console.log("❌ Log Missing");
    }

    // Cleanup
    await prisma.role.delete({ where: { id: role.id, companyId: 1 } });
  } catch (e) {
    console.error(e);
  }
}

main();
