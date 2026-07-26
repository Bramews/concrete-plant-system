const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { username: "Ahmed" },
    update: {
      role: "SYSTEM_OWNER",
      password: "123",
    },
    create: {
      username: "Ahmed",
      name: "Ahmed Malik",
      email: "ahmed@concrete.com",
      password: "123",
      role: "SYSTEM_OWNER",
      status: "ACTIVE",
    },
  });
  console.log("User Ahmed created/updated successfully as SYSTEM_OWNER");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
