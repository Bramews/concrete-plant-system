const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];

  if (arg === "update") {
    console.log("Updating Landing Page Config...");
    await prisma.landingPageConfig.upsert({
      where: { id: 1 },
      update: { heroTitleEn: "VERIFICATION_TEST_TITLE" },
      create: {
        id: 1,
        heroTitleEn: "VERIFICATION_TEST_TITLE",
        heroTitleAr: "تجربة",
        heroSubtitleEn: "Sub",
        heroSubtitleAr: "فرعي",
        loginTextAr: "Login",
        loginTextEn: "Login",
        ctaTextAr: "CTA",
        ctaTextEn: "CTA",
        features: "[]",
      },
    });
    console.log("Updated.");
  } else if (arg === "revert") {
    console.log("Reverting Landing Page Config...");
    await prisma.landingPageConfig.update({
      where: { id: 1 },
      data: { heroTitleEn: "Concrete Plant Management System" },
    });
    console.log("Reverted.");
  } else {
    console.log("Usage: node update-landing-db.js [update|revert]");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
