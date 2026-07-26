const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    orderBy: { id: "asc" },
  });

  console.log("---------------------------------------------------");
  console.log("CURRENT DATABASE STATE (ROLES):");
  console.log("ID | Name | DisplayName | isSystem");
  console.log("---|---|---|---");
  roles.forEach((r) => {
    console.log(`${r.id} | ${r.name} | ${r.displayName} | ${r.isSystem}`);
  });
  console.log("---------------------------------------------------");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
