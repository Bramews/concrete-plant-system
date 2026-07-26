const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CORRECT_ROLES = {
  "Company Admin": "COMPANY_ADMIN",
  company_admin: "COMPANY_ADMIN",
  Manager: "MANAGER",
  department_manager: "DEPARTMENT_MANAGER",
  "Department Manager": "DEPARTMENT_MANAGER",
  Operator: "OPERATOR",
  operator: "OPERATOR",
  "Sales Representative": "SALES_REP",
  "Sales Rep": "SALES_REP",
  "Lab Technician": "LAB_TECH",
  "Lab Tech": "LAB_TECH",
  Driver: "DRIVER",
  Accountant: "ACCOUNTANT",
  // Add others if seen in screenshot
};

const TARGET_DEFINITIONS = {
  COMPANY_ADMIN: "الإدارة",
  MANAGER: "مدير",
  DEPARTMENT_MANAGER: "مدير قسم",
  ADMINISTRATION: "الإدارة (قسم)",
  LABORATORY: "المختبر",
  ACCOUNTING: "الحسابات",
  OPERATIONS: "التشغيل",
  SALES: "المبيعات",
  DISPATCH: "الحركة",
  ENGINEER: "مهندس",
  TECHNICIAN: "فني",
  WORKER: "عامل",
  AUDITOR: "مدقق",
  ACCOUNTANT: "محاسب",
  OPERATOR: "مشغل",
  DRIVER: "سائق",
  SALES_REP: "مندوب مبيعات",
  LAB_TECH: "فني مختبر",
  DISPATCHER: "مسؤول الحركة",
};

async function main() {
  console.log("=== NUCLEAR ROLE REPAIR ===");

  // 1. Ensure Target Roles Exist with correct DisplayName + isSystem
  for (const [code, arabicName] of Object.entries(TARGET_DEFINITIONS)) {
    const existing = await prisma.role.findFirst({ where: { name: code } });
    if (existing) {
      console.log(`Update ${code} -> ${arabicName}`);
      await prisma.role.update({
        where: { id: existing.id },
        data: { displayName: arabicName, isSystem: true, companyId: null },
      });
    } else {
      console.log(`Create ${code} -> ${arabicName}`);
      await prisma.role.create({
        data: { name: code, displayName: arabicName, isSystem: true },
      });
    }
  }

  // 2. Scan all roles. If name is NOT in TARGET_DEFINITIONS keys (and not SYSTEM_OWNER), migrate memberships and delete.
  const allRoles = await prisma.role.findMany({
    include: { _count: { select: { memberships: true } } },
  });

  for (const role of allRoles) {
    if (role.name === "SYSTEM_OWNER") continue;
    if (TARGET_DEFINITIONS[role.name]) continue; // It is a correct role

    console.log(
      `Found INVALID role: ${role.name} (ID: ${role.id}) - Used by ${role._count.memberships} users`,
    );

    // Determine target
    let targetName = CORRECT_ROLES[role.name];
    if (!targetName) {
      // Fallback map by partial string or just default to something safe? Or just Log?
      // If name matches a Key in TARGET_DEFINITIONS but case differed?
      const upper = role.name.toUpperCase().replace(/\s+/g, "_");
      if (TARGET_DEFINITIONS[upper]) targetName = upper;
    }

    if (targetName) {
      console.log(`  -> Migrating to ${targetName}`);
      const targetRole = await prisma.role.findFirst({
        where: { name: targetName },
      });
      if (targetRole) {
        // Update Memberships
        const updated = await prisma.membership.updateMany({
          where: { roleId: role.id },
          data: { roleId: targetRole.id },
        });
        console.log(`  -> Migrated ${updated.count} memberships.`);

        // Now delete the invalid role
        await prisma.role.delete({ where: { id: role.id } });
        console.log(`  -> Deleted invalid role.`);
      } else {
        console.error(
          `  -> Target rol ${targetName} NOT FOUND. Cannot migrate.`,
        );
      }
    } else {
      console.log(
        `  -> NO MAPPING found for ${role.name}. Deleting if empty...`,
      );
      if (role._count.memberships === 0) {
        await prisma.role.delete({ where: { id: role.id } });
        console.log(`  -> Deleted empty invalid role.`);
      } else {
        console.error(
          `  -> Role has users but no mapping! Leaving it to avoid data loss, but renaming display.`,
        );
        await prisma.role.update({
          where: { id: role.id },
          data: { displayName: `FIXME: ${role.name}` },
        });
      }
    }
  }

  // 3. Final Verification Output
  const finalRoles = await prisma.role.findMany({
    where: {
      OR: [{ isSystem: true }, { companyId: null }],
      NOT: { name: "SYSTEM_OWNER" },
    },
    select: { name: true, displayName: true, isSystem: true },
  });
  console.log("=== FINAL VALID ROLES ===");
  console.table(finalRoles);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
