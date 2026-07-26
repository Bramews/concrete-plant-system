const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.role.findMany();
  console.log("ROLES_DATA_START");
  roles.forEach((r) => console.log(JSON.stringify(r)));
  console.log("ROLES_DATA_END");
}
main().finally(() => prisma.$disconnect());
