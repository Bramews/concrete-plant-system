const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- START DATABASE INSPECTION ---");

  // 1. Inspect Roles
  const roles = await prisma.role.findMany();
  console.log(`\n[ROLES] Total: ${roles.length}`);
  roles.forEach((r) => {
    console.log(
      `- ID: ${r.id}, Name: "${r.name}", Display: "${r.displayName}", isSystem: ${r.isSystem}`,
    );
  });

  // 2. Inspect Company 3
  const companyId = 3;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      memberships: {
        include: { user: true, role: true },
      },
    },
  });

  if (company) {
    console.log(
      `\n[COMPANY 3] Name: ${company.name}, Memberships: ${company.memberships.length}`,
    );
    company.memberships.forEach((m) => {
      console.log(
        `- User: ${m.user.name} (${m.user.email}), Role: ${m.role?.name}, Status: ${m.status}, Deleted: ${m.deletedAt}`,
      );
    });
  } else {
    console.log("\n[COMPANY 3] NOT FOUND");
  }

  // 3. Inspect Users without memberships but with companyId = 3
  const orphanUsers = await prisma.user.findMany({
    where: {
      companyId: companyId,
      memberships: { none: {} },
    },
  });
  console.log(`\n[ORPHAN USERS CO 3] Total: ${orphanUsers.length}`);
  orphanUsers.forEach((u) => console.log(`- ${u.name} (${u.email})`));

  console.log("\n--- END DATABASE INSPECTION ---");
}

main().finally(() => prisma.$disconnect());
