import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// القائمة الذهبية - 13 دوراً فقط
const GOLDEN_ROLES = {
  SYSTEM_OWNER: "مالك النظام",
  COMPANY_ADMIN: "الإدارة",
  LAB_MANAGER: "مدير مختبر",
  LAB_ENGINEER: "مهندس مختبر",
  LAB_TECH: "فني مختبر",
  LAB_WORKER: "عامل مختبر",
  OPERATOR: "مشغل",
  WORKER: "عامل معمل",
  ACCOUNTANT: "مدير الحسابات",
  AUDITOR: "مدقق الحسابات",
  SALES_MANAGER: "مدير المبيعات",
  SALES_REP: "مندوب المبيعات",
  SECURITY: "حارس أمن",
};

async function fixRBAC() {
  console.log("=== بدء إصلاح نظام الأدوار والصلاحيات ===\n");

  try {
    // 1. فحص الأدوار الحالية
    const existingRoles = await prisma.role.findMany({
      where: { companyId: null },
    });
    console.log(`📋 الأدوار الموجودة حالياً: ${existingRoles.length}`);
    existingRoles.forEach((r) =>
      console.log(`   - ${r.name} → ${r.displayName}`),
    );

    // 2. حذف الأدوار الزائدة
    const allowedNames = Object.keys(GOLDEN_ROLES);
    const rolesToDelete = existingRoles.filter(
      (r) => !allowedNames.includes(r.name),
    );

    if (rolesToDelete.length > 0) {
      console.log(`\n🗑️  سيتم حذف ${rolesToDelete.length} دور زائد:`);
      rolesToDelete.forEach((r) => console.log(`   - ${r.name}`));

      for (const r of rolesToDelete) {
        try {
          await prisma.role.delete({ where: { id: r.id } });
          console.log(`   ✅ تم حذف ${r.name}`);
        } catch (err: any) {
          console.log(`   ⚠️  فشل حذف ${r.name}: ${err.message}`);
        }
      }
    } else {
      console.log("\n✅ لا توجد أدوار زائدة للحذف");
    }

    // 3. إنشاء/تحديث الأدوار المطلوبة
    console.log(`\n📝 تحديث الأدوار المطلوبة...`);
    for (const [name, displayName] of Object.entries(GOLDEN_ROLES)) {
      const existing = await prisma.role.findFirst({
        where: { name, companyId: null },
      });

      if (existing) {
        await prisma.role.update({
          where: { id: existing.id },
          data: {
            displayName,
            isSystem: true,
            isSovereign: name === "SYSTEM_OWNER",
          },
        });
        console.log(`   ✅ تم تحديث ${name}`);
      } else {
        await prisma.role.create({
          data: {
            name,
            displayName,
            isSystem: true,
            isSovereign: name === "SYSTEM_OWNER",
            companyId: null,
          },
        });
        console.log(`   ✅ تم إنشاء ${name}`);
      }
    }

    // 4. التحقق من الصلاحيات
    console.log(`\n🔐 فحص الصلاحيات...`);
    const permCount = await prisma.permission.count();
    console.log(`   عدد الصلاحيات: ${permCount}`);

    if (permCount === 0) {
      console.log(`   ⚠️  لا توجد صلاحيات! يجب تشغيل seed-permissions.ts`);
    }

    // 5. ربط جميع الصلاحيات بـ SYSTEM_OWNER
    const sysOwner = await prisma.role.findFirst({
      where: { name: "SYSTEM_OWNER", companyId: null },
    });

    if (sysOwner && permCount > 0) {
      console.log(`\n👑 ربط جميع الصلاحيات بـ SYSTEM_OWNER...`);
      const allPerms = await prisma.permission.findMany();

      // حذف الارتباطات القديمة
      await prisma.rolePermission.deleteMany({
        where: { roleId: sysOwner.id },
      });

      // إنشاء ارتباطات جديدة
      for (const perm of allPerms) {
        await prisma.rolePermission.create({
          data: {
            roleId: sysOwner.id,
            permissionId: perm.id,
          },
        });
      }
      console.log(`   ✅ تم ربط ${allPerms.length} صلاحية`);
    }

    // 6. النتائج النهائية
    console.log(`\n=== النتائج النهائية ===`);
    const finalRoles = await prisma.role.findMany({
      where: { companyId: null },
      orderBy: { name: "asc" },
    });
    console.log(`📋 عدد الأدوار: ${finalRoles.length}`);
    finalRoles.forEach((r) =>
      console.log(
        `   ${r.name.padEnd(20)} → ${r.displayName} ${r.isSovereign ? "[سيادي]" : ""}`,
      ),
    );

    const rolePermCount = await prisma.rolePermission.count();
    console.log(`\n🔗 ارتباطات الأدوار-الصلاحيات: ${rolePermCount}`);

    console.log(`\n✅ اكتمل الإصلاح بنجاح!`);
  } catch (error: any) {
    console.error("❌ خطأ:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRBAC();
