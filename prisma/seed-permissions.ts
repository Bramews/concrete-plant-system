import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RESOURCES = [
  "users",
  "roles",
  "orders",
  "clients",
  "projects",
  "mix_designs",
  "lab_tests",
  "production",
  "fleet",
  "inventory",
  "invoices",
  "reports",
  "settings",
  "audit_logs",
];

const ACTIONS = [
  { name: "create", description: "Create new items" },
  { name: "read", description: "View details" },
  { name: "update", description: "Edit existing items" },
  { name: "delete", description: "Remove items" },
  { name: "approve", description: "Approve workflow steps" },
  { name: "export", description: "Export data" },
];

async function main() {
  console.log("🌱 Seeding System Permissions...");

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      // Create permission if not exists
      await prisma.permission.upsert({
        where: {
          resource_action: {
            resource,
            action: action.name,
          },
        },
        update: {},
        create: {
          resource,
          action: action.name,
          description: `${action.description} for ${resource}`,
        },
      });
    }
  }

  console.log("✅ Permissions Seeded Successfully.");

  // Optional: Auto-assign all permissions to SYSTEM_OWNER role
  const sysOwnerRole = await prisma.role.findFirst({
    where: { name: "SYSTEM_OWNER", companyId: null },
  });

  if (sysOwnerRole) {
    console.log("👑 Assigning all permissions to SYSTEM_OWNER...");
    const allPerms = await prisma.permission.findMany();

    // Use transaction for cleaner update
    await prisma.$transaction(async (tx) => {
      // clean old
      await tx.rolePermission.deleteMany({
        where: { roleId: sysOwnerRole.id },
      });

      // insert new
      for (const p of allPerms) {
        await tx.rolePermission.create({
          data: {
            roleId: sysOwnerRole.id,
            permissionId: p.id,
          },
        });
      }
    });
    console.log("✅ SYSTEM_OWNER is fully empowered.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
