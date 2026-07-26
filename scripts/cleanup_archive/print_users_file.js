const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  const output = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    companyId: u.companyId,
  }));
  fs.writeFileSync("DEBUG_USERS.json", JSON.stringify(output, null, 2));
}
main().finally(() => prisma.$disconnect());
