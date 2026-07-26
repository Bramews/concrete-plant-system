const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const landing = await prisma.landingPageConfig.findFirst();
    console.log(
      "LandingPageConfig exists, result:",
      landing ? "found" : "empty",
    );

    const settings = await prisma.systemSetting.count();
    console.log("SystemSetting count:", settings);

    const users = await prisma.user.count();
    console.log("User count:", users);
  } catch (e) {
    console.error("Verification failed:", e.message);
  } finally {
    process.exit(0);
  }
}

main();
