import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "test7@112";
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, password: true },
  });

  if (!user) {
    console.log(`User ${username} not found`);
  } else {
    console.log("User Found:", user);
    // console.log("Plain Password:", `"${(user as any).plainPassword}"`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
