const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== ROLE AUDIT ===");
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`Total Roles Found: ${roles.length}`);
  console.table(
    roles.map((r) => ({
      id: r.id,
      name: r.name,
      display: r.displayName,
      isSystem: r.isSystem,
      companyId: r.companyId,
    })),
  );

  if (roles.length === 0) {
    console.log("No roles found! This is critical.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
