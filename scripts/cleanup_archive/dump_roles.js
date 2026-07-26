const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  console.log("Dumping roles...");
  try {
    const roles = await prisma.role.findMany({ orderBy: { id: "asc" } });
    fs.writeFileSync("roles_dump.json", JSON.stringify(roles, null, 2));
    console.log(`Dumped ${roles.length} roles.`);
  } catch (e) {
    fs.writeFileSync("roles_dump_error.txt", e.toString());
    console.error(e);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
