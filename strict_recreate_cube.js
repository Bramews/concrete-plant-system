const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs"); // Assuming bcryptjs is used based on package.json
const prisma = new PrismaClient();

async function hashPassword(password) {
  return await hash(password, 10);
}

async function main() {
  const USERNAME = "cube";
  const PASSWORD = "123";

  console.log(`--- [1] البدء في تطهير اسم المستخدم: ${USERNAME} ---`);

  // 1. الاستعلام والتحقق
  const existingUsers = await prisma.user.findMany({
    where: { username: USERNAME },
  });
  console.log(`تم العثور على ${existingUsers.length} سجلات بهذا الاسم.`);

  // 2. الحذف الصارم والكامل
  if (existingUsers.length > 0) {
    const ids = existingUsers.map((u) => u.id);
    await prisma.session.deleteMany({ where: { userId: { in: ids } } });
    await prisma.membership.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userSetting.deleteMany({ where: { userId: { in: ids } } });

    await prisma.user.deleteMany({ where: { username: USERNAME } });
    console.log(`تم حذف جميع السجلات المتعلقة بـ ${USERNAME} نهائياً.`);
  }

  // 3. إنشاء مستخدم واحد جديد ونظيف
  console.log(`--- [2] إنشاء مستخدم ${USERNAME} جديد ---`);

  const company = await prisma.company.findFirst();
  const rootAdminRole = await prisma.role.findFirst({
    where: { name: "SYSTEM_OWNER" },
  });
  const managerRole = await prisma.role.findFirst({
    where: { name: "COMPANY_ADMIN" },
  });

  const newUser = await prisma.user.create({
    data: {
      username: USERNAME,
      name: "Sovereign Cube",
      email: "cube@concrete.com",
      password: await hashPassword(PASSWORD),
      plainPassword: PASSWORD,
      status: "ACTIVE",
      companyId: company ? company.id : undefined,
      canCreateUsers: true,
      memberships: {
        create: {
          companyId: company ? company.id : undefined,
          roleId: managerRole
            ? managerRole.id
            : rootAdminRole
              ? rootAdminRole.id
              : 1,
        },
      },
    },
  });
  console.log(`تم إنشاء المستخدم الجديد بنجاح. معرف المستخدم: ${newUser.id}`);

  // 4. تصفير البيئة
  console.log(`--- [3] تصفير كافة الجلسات وإعادة تشغيل النظام ---`);
  await prisma.session.deleteMany({});
  console.log("تم مسح جدول الجلسات بالكامل.");

  // التحقق النهائي من قاعدة البيانات
  const finalCheck = await prisma.user.findMany({
    where: { username: USERNAME },
  });
  console.log(
    "التحقق النهائي من جدول المستخدمين:",
    JSON.stringify(finalCheck, null, 2),
  );
}

main()
  .catch((e) => console.error("❌ فشل السكربت:", e.message))
  .finally(() => prisma.$disconnect());
