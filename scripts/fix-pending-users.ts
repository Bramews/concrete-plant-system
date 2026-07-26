import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("========================================");
  console.log("تصحيح حالة المستخدمين المعلقة (PENDING)");
  console.log("========================================\n");

  try {
    // 1. Find all PENDING users
    const pendingUsers = await prisma.user.findMany({
      where: { status: "PENDING" },
      select: { id: true, username: true, email: true, status: true },
    });

    console.log(`📊 عدد المستخدمين بحالة PENDING: ${pendingUsers.length}`);

    if (pendingUsers.length === 0) {
      console.log(
        "\n✅ لا توجد مستخدمين بحالة PENDING - قاعدة البيانات سليمة!",
      );
      return;
    }

    console.log("\n🔍 المستخدمون المعلقون:");
    pendingUsers.forEach((u) => {
      console.log(
        `   - ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`,
      );
    });

    // 2. Update them to ACTIVE
    console.log("\n⚙️  جاري تحديث الحالة إلى ACTIVE...");
    const updateResult = await prisma.user.updateMany({
      where: { status: "PENDING" },
      data: { status: "ACTIVE" },
    });

    console.log(`\n✅ تم تحديث ${updateResult.count} مستخدم بنجاح!`);

    // 3. Verify the fix
    const stillPending = await prisma.user.count({
      where: { status: "PENDING" },
    });

    if (stillPending === 0) {
      console.log("\n✅✅✅ التحقق النهائي: جميع المستخدمين الآن ACTIVE!");
    } else {
      console.error(
        `\n❌ تحذير: لا يزال هناك ${stillPending} مستخدمين بحالة PENDING!`,
      );
    }

    // 4. Show all users status summary
    const statusSummary = await prisma.user.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    console.log("\n📈 ملخص حالات المستخدمين:");
    statusSummary.forEach((s) => {
      console.log(`   ${s.status}: ${s._count.status} مستخدم`);
    });
  } catch (e) {
    console.error("\n❌ خطأ أثناء التنفيذ:", e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
