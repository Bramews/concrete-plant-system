import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { username: "Ahmed" } });
  if (user) {
    console.log("USER_AHMED_IS_READY");
  } else {
    console.log("USER_AHMED_MISSING");
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
