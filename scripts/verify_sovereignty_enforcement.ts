import { prisma } from "../lib/prisma";
import { SystemModule, requireUnsealedModule } from "../lib/governance";

async function testSealing() {
  console.log("🚀 Testing Sovereignty Sealing...");

  const testModule = SystemModule.LAB_RECORDS;

  try {
    // 1. Ensure module is unsealed
    await (prisma as any).moduleSeal.upsert({
      where: { moduleName: testModule },
      update: { isSealed: false },
      create: { moduleName: testModule, isSealed: false },
    });
    console.log(`✅ Module ${testModule} unsealed.`);

    // 2. Check unsealed access
    await requireUnsealedModule(testModule);
    console.log("✅ requireUnsealedModule passed for unsealed module.");

    // 3. Seal module
    await (prisma as any).moduleSeal.update({
      where: { moduleName: testModule },
      data: { isSealed: true, reason: "Verification Test" },
    });
    console.log(`🔒 Module ${testModule} sealed.`);

    // 4. Check sealed access (Should throw)
    try {
      await requireUnsealedModule(testModule);
      console.error(
        "❌ ERROR: requireUnsealedModule should have thrown but didn't!",
      );
      process.exit(1);
    } catch (e: any) {
      console.log(
        `✅ requireUnsealedModule correctly blocked access: ${e.message}`,
      );
    }

    // 5. Cleanup
    await (prisma as any).moduleSeal.update({
      where: { moduleName: testModule },
      data: { isSealed: false },
    });
    console.log("✅ Cleanup complete.");

    console.log("\n🎊 Sovereignty Enforcement Verified.");
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSealing();
