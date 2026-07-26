const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log("USERS_DATA_START");
  users.forEach((u) =>
    console.log(
      JSON.stringify({
        id: u.id,
        email: u.email,
        name: u.name,
        companyId: u.companyId,
      }),
    ),
  );
  console.log("USERS_DATA_END");
}
main().finally(() => prisma.$disconnect());
