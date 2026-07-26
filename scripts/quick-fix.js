const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("تصحيح المستخدمين المعلقة...");
  const result = await prisma.user.updateMany({
    where: { status: "PENDING" },
    data: { status: "ACTIVE" },
  });
  console.log("تم تحديث " + result.count + " مستخدم");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
