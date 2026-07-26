const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { id: 925474 },
    data: {
      username: "deleted_925474_test@test",
      email: "deleted_925474_12@121",
      status: "DISABLED",
      deletedAt: new Date(),
    },
  });
  console.log("Fixed user 12");
}
main().finally(() => prisma.$disconnect());
