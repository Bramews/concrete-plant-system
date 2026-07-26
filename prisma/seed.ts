import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- CONFIGURATION ---
const DEPARTMENTS = [
  { name: "ADMINISTRATION", displayName: "الإدارة" },
  { name: "LABORATORY", displayName: "المختبر" },
  { name: "ACCOUNTING", displayName: "الحسابات" },
  { name: "OPERATIONS", displayName: "التشغيل" },
  { name: "SALES", displayName: "المبيعات" },
  { name: "DISPATCH", displayName: "الحركة" },
];

const ROLES = [
  // Sovereign
  {
    name: "SYSTEM_OWNER",
    displayName: "مالك النظام",
    isSystem: true,
    isSovereign: true,
    department: null,
  },

  // Company Management
  {
    name: "COMPANY_ADMIN",
    displayName: "مدير الشركة",
    isSystem: true,
    department: "ADMINISTRATION",
  },

  // Laboratory Roles
  {
    name: "LAB_MANAGER",
    displayName: "مدير مختبر",
    isSystem: true,
    department: "LABORATORY",
  },
  {
    name: "LAB_ENGINEER",
    displayName: "مهندس مختبر",
    department: "LABORATORY",
  },
  {
    name: "LAB_TECH",
    displayName: "فني مختبر",
    department: "LABORATORY",
  },
  {
    name: "LAB_WORKER",
    displayName: "عامل مختبر",
    department: "LABORATORY",
  },

  // Plant/Production Roles
  {
    name: "OPERATOR",
    displayName: "مشغل",
    department: "OPERATIONS",
  },
  {
    name: "WORKER",
    displayName: "عامل معمل",
    department: "OPERATIONS",
  },

  // Accounting Roles
  {
    name: "ACCOUNTANT",
    displayName: "مدير الحسابات",
    department: "ACCOUNTING",
  },
  {
    name: "AUDITOR",
    displayName: "مدقق الحسابات",
    department: "ACCOUNTING",
  },

  // Sales Roles
  {
    name: "SALES_MANAGER",
    displayName: "مدير المبيعات",
    isSystem: true,
    department: "SALES",
  },
  {
    name: "SALES_REP",
    displayName: "مندوب المبيعات",
    department: "SALES",
  },

  // Security
  {
    name: "SECURITY",
    displayName: "حارس أمن",
    department: "ADMINISTRATION",
  },

  // System owner is handled separately in logic but ensuring it's in enum if needed
];

const FEATURES = [
  {
    id: "ADVANCED_REPORTING",
    description: "تقارير متقدمة",
    globalEnabled: true,
  },
  { id: "MULTI_BRANCH", description: "دعم تعدد الفروع", globalEnabled: false },
  { id: "API_ACCESS", description: "وصول API", globalEnabled: false },
];

const PLANS = [
  { key: "BASIC", name: "الأساسية", maxUsers: 5, maxOrders: 100 },
  { key: "PRO", name: "المتقدمة", maxUsers: 20, maxOrders: 1000 },
  { key: "ENTERPRISE", name: "للمؤسسات", maxUsers: 100, maxOrders: 10000 },
];

async function hashPassword(pwd: string) {
  return await bcrypt.hash(pwd, 10);
}

async function main() {
  console.log("🌱 Starting Enterprise Architecture Seed...");

  // 1. Seed Features
  console.log("... Seeding Features");
  for (const f of FEATURES) {
    await prisma.feature.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  // 2. Seed Plans
  console.log("... Seeding Plans");
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { key: p.key },
      update: { ...p, features: "[]", maxStorage: 1000, maxProjects: 10 },
      create: { ...p, features: "[]", maxStorage: 1000, maxProjects: 10 },
    });
  }

  // 3. Seed Departments
  console.log("... Seeding Departments");
  const deptMap = new Map<string, number>();
  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { name: d.name },
      update: { displayName: d.displayName },
      create: d,
    });
    deptMap.set(d.name, dept.id);
  }

  // 4. Seed Roles
  console.log("... Seeding Roles");
  for (const r of ROLES) {
    const deptId = r.department ? deptMap.get(r.department) : null;
    const existingRole = await prisma.role.findFirst({
      where: {
        name: r.name,
        companyId: null,
      },
    });

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          displayName: r.displayName,
          isSystem: r.isSystem || false,
          isSovereign: r.isSovereign || false,
          departmentId: deptId,
        },
      });
    } else {
      await prisma.role.create({
        data: {
          name: r.name,
          displayName: r.displayName,
          isSystem: r.isSystem || false,
          isSovereign: r.isSovereign || false,
          departmentId: deptId,
          companyId: null,
        },
      });
    }
  }

  // 5. System Owner (The Sovereign)
  console.log("... Ensuring System Owner");
  await prisma.systemOwner.upsert({
    where: { email: "ahmed@concrete.com" },
    update: {},
    create: {
      email: "ahmed@concrete.com",
      name: "Ahmed Aziz",
      password: await hashPassword("123"),
    },
  });

  // 5.1 Ensure System Owner is also a USER (for Login)
  console.log("... Ensuring System Owner User Record");
  const sysOwnerRole = await prisma.role.findFirstOrThrow({
    where: { name: "SYSTEM_OWNER", companyId: null },
  });

  const sysOwnerUser = await prisma.user.upsert({
    where: { email: "ahmed@concrete.com" },
    update: {
      status: "ACTIVE",
    },
    create: {
      username: "Ahmed",
      email: "ahmed@concrete.com",
      password: await hashPassword("123"),
      name: "Ahmed Aziz",
      status: "ACTIVE",
      memberships: {
        create: {
          roleId: sysOwnerRole.id,
          companyId: null, // Sovereign has no company (or nullable)
        },
      },
    },
  });

  // 6. Demo Company & Users
  console.log("... Creating/Updating Demo Company");
  const company = await prisma.company.upsert({
    where: { slug: "demo-plant" },
    update: {},
    create: {
      slug: "demo-plant",
      name: "الشركة النموذجية للخرسانة",
      status: "ACTIVE",
    },
  });

  // Ensure Subscription
  const proPlan = await prisma.plan.findUniqueOrThrow({
    where: { key: "PRO" },
  });
  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      planId: proPlan.id,
      stripeId: "sub_demo_123",
      status: "ACTIVE",
    },
  });

  // Create Company Admin User
  console.log("... Creating Company Admin");
  const adminRole = await prisma.role.findFirstOrThrow({
    where: { name: "COMPANY_ADMIN", companyId: null },
  });
  const adminDept = await prisma.department.findUniqueOrThrow({
    where: { name: "ADMINISTRATION" },
  });

  const compAdmin = await prisma.user.upsert({
    where: { username: "manager" },
    update: {
      departmentId: adminDept.id,
    },
    create: {
      username: "manager",
      email: "manager@demo.com",
      password: await hashPassword("123"),
      name: "مدير الشركة",
      companyId: company.id,
      departmentId: adminDept.id,
    },
  });

  // Assign Membership
  await prisma.membership.upsert({
    where: {
      userId_companyId: { userId: compAdmin.id, companyId: company.id },
    },
    update: { roleId: adminRole.id },
    create: {
      userId: compAdmin.id,
      companyId: company.id,
      roleId: adminRole.id,
    },
  });

  // 7. Seed Permissions
  console.log("... Seeding Permissions");
  const PERMISSIONS_MAP = [
    {
      id: "USERS_CREATE",
      resource: "users",
      action: "create",
      description: "إنشاء مستخدمين",
    },
    {
      id: "USERS_READ",
      resource: "users",
      action: "read",
      description: "عرض المستخدمين",
    },
    {
      id: "USERS_UPDATE",
      resource: "users",
      action: "update",
      description: "تحديث المستخدمين",
    },
    {
      id: "USERS_DELETE",
      resource: "users",
      action: "delete",
      description: "حذف المستخدمين",
    },
    {
      id: "ROLES_CREATE",
      resource: "roles",
      action: "create",
      description: "إنشاء أدوار",
    },
    {
      id: "ROLES_READ",
      resource: "roles",
      action: "read",
      description: "عرض الأدوار",
    },
    {
      id: "ROLES_UPDATE",
      resource: "roles",
      action: "update",
      description: "تحديث الأدوار",
    },
    {
      id: "ROLES_DELETE",
      resource: "roles",
      action: "delete",
      description: "حذف الأدوار",
    },
    {
      id: "ORDERS_CREATE",
      resource: "orders",
      action: "create",
      description: "إنشاء طلبات",
    },
    {
      id: "ORDERS_READ",
      resource: "orders",
      action: "read",
      description: "عرض الطلبات",
    },
    {
      id: "ORDERS_UPDATE",
      resource: "orders",
      action: "update",
      description: "تحديث الطلبات",
    },
    {
      id: "ORDERS_DELETE",
      resource: "orders",
      action: "delete",
      description: "حذف الطلبات",
    },
    {
      id: "ORDERS_APPROVE",
      resource: "orders",
      action: "approve",
      description: "اعتماد الطلبات",
    },
    {
      id: "PROJECTS_CREATE",
      resource: "projects",
      action: "create",
      description: "إنشاء مشاريع",
    },
    {
      id: "PROJECTS_READ",
      resource: "projects",
      action: "read",
      description: "عرض المشاريع",
    },
    {
      id: "PROJECTS_UPDATE",
      resource: "projects",
      action: "update",
      description: "تحديث المشاريع",
    },
    {
      id: "PROJECTS_DELETE",
      resource: "projects",
      action: "delete",
      description: "حذف المشاريع",
    },
    {
      id: "CLIENTS_CREATE",
      resource: "clients",
      action: "create",
      description: "إنشاء عملاء",
    },
    {
      id: "CLIENTS_READ",
      resource: "clients",
      action: "read",
      description: "عرض العملاء",
    },
    {
      id: "CLIENTS_UPDATE",
      resource: "clients",
      action: "update",
      description: "تحديث العملاء",
    },
    {
      id: "CLIENTS_DELETE",
      resource: "clients",
      action: "delete",
      description: "حذف العملاء",
    },
    {
      id: "MIX_DESIGNS_CREATE",
      resource: "mix_designs",
      action: "create",
      description: "إنشاء خلطات",
    },
    {
      id: "MIX_DESIGNS_READ",
      resource: "mix_designs",
      action: "read",
      description: "عرض الخلطات",
    },
    {
      id: "MIX_DESIGNS_UPDATE",
      resource: "mix_designs",
      action: "update",
      description: "تحديث الخلطات",
    },
    {
      id: "MIX_DESIGNS_DELETE",
      resource: "mix_designs",
      action: "delete",
      description: "حذف الخلطات",
    },
    {
      id: "LAB_TESTS_CREATE",
      resource: "lab_tests",
      action: "create",
      description: "إنشاء فحوصات",
    },
    {
      id: "LAB_TESTS_READ",
      resource: "lab_tests",
      action: "read",
      description: "عرض الفحوصات",
    },
    {
      id: "LAB_TESTS_UPDATE",
      resource: "lab_tests",
      action: "update",
      description: "تحديث الفحوصات",
    },
    {
      id: "LAB_TESTS_DELETE",
      resource: "lab_tests",
      action: "delete",
      description: "حذف الفحوصات",
    },
    {
      id: "PRODUCTION_CREATE",
      resource: "production",
      action: "create",
      description: "بدء إنتاج",
    },
    {
      id: "PRODUCTION_READ",
      resource: "production",
      action: "read",
      description: "عرض الإنتاج",
    },
    {
      id: "PRODUCTION_UPDATE",
      resource: "production",
      action: "update",
      description: "تحديث الإنتاج",
    },
    {
      id: "PRODUCTION_DELETE",
      resource: "production",
      action: "delete",
      description: "حذف الإنتاج",
    },
    {
      id: "FLEET_READ",
      resource: "fleet",
      action: "read",
      description: "عرض الأسطول",
    },
    {
      id: "INVENTORY_READ",
      resource: "inventory",
      action: "read",
      description: "عرض المخزون",
    },
    {
      id: "INVOICES_READ",
      resource: "invoices",
      action: "read",
      description: "عرض الفواتير",
    },
    {
      id: "REPORTS_READ",
      resource: "reports",
      action: "read",
      description: "عرض التقارير",
    },
    {
      id: "SETTINGS_UPDATE",
      resource: "settings",
      action: "update",
      description: "تحديث الإعدادات",
    },
    {
      id: "AUDIT_LOGS_READ",
      resource: "audit_logs",
      action: "read",
      description: "عرض السجلات",
    },
  ];

  for (const perm of PERMISSIONS_MAP) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
      create: perm,
    });
  }

  // 7.1 Assign all to System Owner Role
  console.log("... Assigning Permissions to System Owner Role");
  const sysOwnerRolePerms = await prisma.role.findFirst({
    where: { name: "SYSTEM_OWNER", companyId: null },
  });

  if (sysOwnerRolePerms) {
    const allPerms = await prisma.permission.findMany();
    // Delete existing to avoid duplicates if re-seeding
    await prisma.rolePermission.deleteMany({
      where: { roleId: sysOwnerRolePerms.id },
    });

    // Create new
    await prisma.$transaction(
      allPerms.map((p) =>
        prisma.rolePermission.create({
          data: { roleId: sysOwnerRolePerms.id, permissionId: p.id },
        }),
      ),
    );
  }

  console.log("✅ Seed Complete. Architecture Ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
