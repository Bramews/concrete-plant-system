const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FEATURES = [
  {
    icon: "Factory",
    titleAr: "إدارة الإنتاج",
    titleEn: "Production Management",
    descriptionAr: "تتبع الإنتاج والتشغيل لحظة بلحظة.",
    descriptionEn: "Real-time production tracking.",
  },
  {
    icon: "FlaskConical",
    titleAr: "مراقبة الجودة",
    titleEn: "Quality Control",
    descriptionAr: "ضبط جودة الخلطات والفحوصات المخبرية.",
    descriptionEn: "Mix quality control and lab tests.",
  },
  {
    icon: "Receipt",
    titleAr: "المبيعات الفورية",
    titleEn: "Sales & Invoicing",
    descriptionAr: "إدارة العقود والفواتير والعملاء.",
    descriptionEn: "Manage contracts, invoices, and clients.",
  },
  {
    icon: "Cloud",
    titleAr: "تقارير ذكية",
    titleEn: "Smart Reports",
    descriptionAr:
      "بياناتك آمنة ومشفرة، مع نسخ احتياطي تلقائي وإمكانية الوصول من أي جهاز.",
    descriptionEn:
      "Your data is secure and encrypted, with auto-backups and access from any device.",
  },
];

async function main() {
  console.log("♻️ Restoring Original Premium Content...");

  await prisma.landingPageConfig.upsert({
    where: { id: 1 },
    update: {
      heroTitleAr: "نظام إدارة مصانع الخرسانة",
      heroTitleEn: "Concrete Plant Management System",
      heroSubtitleAr:
        "الحل المتكامل لإدارة الإنتاج، الجودة، والمبيعات بأحدث التقنيات السحابية. تحكم كامل بمصنعك من أي مكان.",
      heroSubtitleEn:
        "The integrated solution for production, quality, and sales management with the latest cloud technologies. Full control from anywhere.",
      ctaTextAr: "ابدأ التجربة المجانية",
      ctaTextEn: "Start Free Trial",
      loginTextAr: "تسجيل الدخول",
      loginTextEn: "Login",
      features: JSON.stringify(FEATURES),
    },
    create: {
      id: 1,
      heroTitleAr: "نظام إدارة مصانع الخرسانة",
      heroTitleEn: "Concrete Plant Management System",
      heroSubtitleAr:
        "الحل المتكامل لإدارة الإنتاج، الجودة، والمبيعات بأحدث التقنيات السحابية. تحكم كامل بمصنعك من أي مكان.",
      heroSubtitleEn:
        "The integrated solution for production, quality, and sales management with the latest cloud technologies. Full control from anywhere.",
      ctaTextAr: "ابدأ التجربة المجانية",
      ctaTextEn: "Start Free Trial",
      loginTextAr: "تسجيل الدخول",
      loginTextEn: "Login",
      features: JSON.stringify(FEATURES),
    },
  });

  console.log("✅ Landing Page Content Restored Successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
