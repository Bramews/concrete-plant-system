import { prisma } from "../lib/prisma";

// const prisma = new PrismaClient(); // Removed to use shared instance

async function main() {
  console.log("🌱 Starting RBAC Seeding...");

  // 1. Defined Resources and Actions
  const resources = [
    "users",
    "roles",
    "companies",
    "orders",
    "billing",
    "reports",
    "settings",
    "logs",
    "production",
    "inventory",
  ];
  const actions = ["create", "read", "update", "delete", "export", "approve"];

  // 2. Create Permissions
  console.log("   - Creating Permissions...");
  for (const resource of resources) {
    for (const action of actions) {
      const id = `${resource}_${action}`.toUpperCase(); // e.g. USERS_CREATE
      await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: {
          id,
          resource,
          action,
          description: `Allow ${action} on ${resource}`,
        },
      });
    }
  }

  // 3. Define System Roles
  const systemRoles = [
    {
      name: "SYSTEM_OWNER",
      displayName: "مالك النظام",
      description: "Full access to everything",
      isSystem: true,
      permissions: ["*"],
    },
    {
      name: "COMPANY_ADMIN",
      displayName: "مدير الشركة",
      description: "Manage company resources",
      isSystem: true,
      permissions: [
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "orders.read",
        "orders.create",
        "orders.update",
        "orders.delete",
        "orders.approve",
        "production.read",
        "production.create",
        "production.update",
        "inventory.read",
        "inventory.create",
        "inventory.update",
        "reports.read",
        "reports.export",
        "billing.read",
      ],
    },
    {
      name: "MANAGER",
      displayName: "مدير المصنع",
      description: "Manage plant operations",
      isSystem: true,
      permissions: [
        "users.read",
        "orders.read",
        "orders.create",
        "orders.update",
        "production.read",
        "reports.read",
      ],
    },
    {
      name: "LAB_TECH",
      displayName: "فني مختبر",
      description: "Perform lab tests",
      isSystem: true,
      permissions: ["production.read"], // Add lab specific permissions later if resource exists
    },
    {
      name: "LAB_ENGINEER",
      displayName: "مهندس مختبر",
      description: "Approve lab tests",
      isSystem: true,
      permissions: ["production.read"],
    },
    {
      name: "OPERATOR",
      displayName: "مشغل النظام",
      description: "Operate production and view orders",
      isSystem: true,
      permissions: [
        "production.read",
        "production.create",
        "production.update",
        "orders.read",
        "inventory.read",
      ],
    },
    {
      name: "SALES",
      displayName: "مبيعات",
      description: "View orders and customers",
      isSystem: true,
      permissions: ["orders.read", "orders.create"],
    },
    {
      name: "ACCOUNTANT",
      displayName: "محاسب",
      description: "View billing and reports",
      isSystem: true,
      permissions: ["billing.read", "reports.read"],
    },
    {
      name: "SAFETY",
      displayName: "مسؤول سلامة",
      description: "View safety logs",
      isSystem: true,
      permissions: ["reports.read"],
    },
    {
      name: "GUARD",
      displayName: "حارس أمن",
      description: "View gate logs",
      isSystem: true,
      permissions: [],
    },
  ];

  // 4. Create Roles and Assign Permissions
  console.log("   - Creating Roles & Assigning Permissions...");

  const allPermissions = await prisma.permission.findMany();

  for (const roleDef of systemRoles) {
    // Manual Upsert Logic for Nullable Field in Compound Key
    let role = await prisma.role.findFirst({
      where: {
        name: roleDef.name,
        companyId: null,
      },
    });

    if (role) {
      role = await prisma.role.update({
        where: { id: role.id },
        data: {
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
        },
      });
    } else {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          companyId: null,
        },
      });
    }

    // Assign Permissions
    let permissionsToAssign: string[] = [];
    if (roleDef.permissions.includes("*")) {
      permissionsToAssign = allPermissions.map((p) => p.id);
    } else {
      // Map "resource.action" -> "RESOURCE_ACTION"
      permissionsToAssign = roleDef.permissions.map((p) =>
        p.toUpperCase().replace(".", "_"),
      );
    }

    for (const permId of permissionsToAssign) {
      const permExists = allPermissions.find((p) => p.id === permId);
      if (permExists) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permId },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  console.log("✅ RBAC Seeding Completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
