const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: "Ahmed" }, { email: "Ahmed" }] },
      include: { memberships: { include: { role: true } } },
    });
    console.log("USER_DATA_START");
    console.log(JSON.stringify(user, null, 2));
    console.log("USER_DATA_END");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
