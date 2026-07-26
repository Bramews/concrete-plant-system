const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- البدء في حذف جميع الجلسات من الجدول ---");
  try {
    const deleted = await prisma.session.deleteMany({});
    console.log(`تم حذف ${deleted.count} جلسة بنجاح من الجدول بالكامل.`);
  } catch (err) {
    console.error("خطأ أثناء الحذف:", err.message);
  } finally {
    await prisma.$disconnect();
    console.log("--- انتهت العملية ---");
  }
}

main();
