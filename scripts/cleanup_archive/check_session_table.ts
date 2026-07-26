import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  console.log("Checking Session table...");
  try {
    const sessionCount = await prisma.session.count();
    console.log(`✅ Session table exists. Current count: ${sessionCount}`);
  } catch (error: any) {
    console.error("❌ Error accessing Session table:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
