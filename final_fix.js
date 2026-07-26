const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function diagnoseAndFix() {
  console.log("=== تشخيص وعلاج الأدوار (محاولة نهائية) ===");

  // 1. قراءة كل الأدوار الحالية
  const allRoles = await prisma.role.findMany({
    where: { companyId: null }, // نفترض أننا نعبث فقط بأدوار النظام الأساسية
  });

  console.log(
    "الأدوار الموجودة حالياً:",
    allRoles.map((r) => `${r.name} (${r.displayName})`).join(", "),
  );

  // 2. القائمة الذهبية (المطلوبة فقط)
  // [RoleName, DisplayName]
  const targetRoles = {
    COMPANY_ADMIN: "الإدارة",
    LAB_MANAGER: "مدير مختبر",
    LAB_ENGINEER: "مهندس مختبر",
    LAB_TECH: "فني مختبر",
    LAB_WORKER: "عامل مختبر",
    OPERATOR: "مشغل", // كما طلب: "المعمل يشمل المشغل"
    WORKER: "عامل معمل",
    ACCOUNTANT: "مدير الحسابات",
    AUDITOR: "مدقق الحسابات",
    SALES_MANAGER: "مدير المبيعات",
    SALES_REP: "مندوب المبيعات",
    SECURITY: "حارس أمن",
    SYSTEM_OWNER: "مالك النظام", // هذا سيادي ولا يمس,
  };

  const allowedNames = Object.keys(targetRoles);

  // 3. الحذف: أي دور اسمه ليس في القائمة الذهبية
  const rolesToDelete = allRoles.filter((r) => !allowedNames.includes(r.name));

  if (rolesToDelete.length > 0) {
    console.log(
      "سيتم حذف الأدوار الزائدة التالية:",
      rolesToDelete.map((r) => r.name),
    );

    // تنفيذ الحذف
    try {
      const deleteParams = {
        where: {
          id: { in: rolesToDelete.map((r) => r.id) },
        },
      };
      // قد يفشل الحذف إذا كان هناك ارتباطات، سنحاول
      const deleted = await prisma.role.deleteMany(deleteParams);
      console.log(`تم حذف ${deleted.count} دور زائد.`);
    } catch (e) {
      console.error(
        "فشل في حذف بعض الأدوار (قد تكون مرتبطة بمستخدمين):",
        e.message,
      );
      // سنحاول حذفهم واحداً تلو الآخر لتحديد المشكلة
      for (const r of rolesToDelete) {
        try {
          await prisma.role.delete({ where: { id: r.id } });
          console.log(`تم حذف ${r.name}`);
        } catch (err) {
          console.error(`عجزت عن حذف ${r.name}: ${err.message}`);
        }
      }
    }
  } else {
    console.log("لا توجد أدوار زائدة للحذف.");
  }

  // 4. التحديث/الإنشاء: ضبط الأسماء والبيانات للأدوار المطلوبة
  for (const [name, displayName] of Object.entries(targetRoles)) {
    // تخطي مالك النظام، له معالجة خاصة ولا نريد العبث به هنا
    if (name === "SYSTEM_OWNER") continue;

    console.log(`جاري ضبط الدور: ${name} -> ${displayName}`);

    // نستخدم upsert لضمان الوجود وتحديث الاسم
    try {
      // بما أن الاسم فريد في سياق الشركة (null)، سنبحث عنه أولاً
      const existing = await prisma.role.findFirst({
        where: { name: name, companyId: null },
      });

      if (existing) {
        await prisma.role.update({
          where: { id: existing.id },
          data: {
            displayName: displayName,
            isSystem: true,
            isSovereign: false, // تأكيد أنه ليس سيادي
          },
        });
        console.log(`تم تحديث اسم ${name} بنجاح.`);
      } else {
        await prisma.role.create({
          data: {
            name: name,
            displayName: displayName,
            isSystem: true,
            isSovereign: false,
            companyId: null,
            departmentId: null, // لا يهم القسم حالياً للسرعة
          },
        });
        console.log(`تم إنشاء ${name} بنجاح.`);
      }
    } catch (e) {
      console.error(`خطأ في معالجة ${name}:`, e.message);
    }
  }

  console.log("=== انتهت العملية ===");
  await prisma.$disconnect();
}

diagnoseAndFix().catch((e) => {
  console.error(e);
  process.exit(1);
});
