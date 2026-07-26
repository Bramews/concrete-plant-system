const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("--- ROLES ---");
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, displayName: true },
  });
  console.log(JSON.stringify(roles, null, 2));

  console.log("--- PERMISSIONS (First 10) ---");
  const perms = await prisma.permission.findMany({ take: 10 });
  console.log(JSON.stringify(perms, null, 2));

  console.log("--- ROLE PERMISSIONS (First 5) ---");
  const rolePerms = await prisma.rolePermission.findMany({
    take: 5,
    include: {
      role: { select: { name: true } },
      permission: { select: { resource: true, action: true } },
    },
  });
  console.log(JSON.stringify(rolePerms, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
