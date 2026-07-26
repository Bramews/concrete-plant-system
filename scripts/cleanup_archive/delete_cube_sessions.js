const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- البدء في حذف جميع جلسات المستخدم cube (ID: 1) ---");
  try {
    const deleted = await prisma.session.deleteMany({
      where: { userId: 1 },
    });
    console.log(`تم حذف ${deleted.count} جلسة بنجاح.`);
  } catch (err) {
    console.error("خطأ أثناء الحذف:", err.message);
  } finally {
    await prisma.$disconnect();
    console.log("--- انتهت العملية ---");
  }
}

main();
