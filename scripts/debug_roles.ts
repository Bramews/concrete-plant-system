import { prisma } from "./lib/prisma";

async function main() {
  console.log("Checking Roles...");
  const roles = await prisma.role.findMany({
    where: { isSystem: true },
  });
  console.log(`Found ${roles.length} system roles:`);
  roles.forEach((r) =>
    console.log(
      `- ID: ${r.id}, Name: "${r.name}", Display: "${r.displayName}"`,
    ),
  );

  console.log("\nChecking Company 3 Users:");
  const companyId = 3;
  const memberships = await prisma.membership.findMany({
    where: { companyId },
    include: { user: true, role: true },
  });
  console.log(`Memberships: ${memberships.length}`);
  memberships.forEach((m) =>
    console.log(
      `- ${m.user.name}, Role: ${m.role?.name}, Status: ${m.status}, Deleted: ${m.deletedAt}`,
    ),
  );
}

main().finally(() => prisma.$disconnect());
