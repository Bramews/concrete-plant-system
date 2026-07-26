import { PrismaClient, Role } from "@prisma/client";
import { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Permissions...");

  // 1. Create Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { id: p },
      create: { id: p, description: p },
      update: {},
    });
  }

  // 2. Map Roles
  for (const [role, perms] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as Role, permissionId: p } },
        create: { role: role as Role, permissionId: p },
        update: {},
      });
    }
  }
  console.log("Permissions seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Permission seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
