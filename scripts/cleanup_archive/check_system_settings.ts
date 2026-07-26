import { prisma } from "@/lib/prisma";
import { getSystemSetting, setSystemSetting } from "@/lib/system-settings";

async function main() {
  console.log("⚙️ Verifying Phase S1: System Settings Sovereignty...");

  // 1. Check Default Logic (Fallback to Code)
  const defaultPlan = await getSystemSetting("DEFAULT_PLAN_KEY");
  console.log(`1️⃣ Default Plan (Code Fallback): ${defaultPlan}`);
  if (defaultPlan !== "BASIC") throw new Error("Default Plan mismatch!");

  // 2. Set Value (DB Override)
  console.log(
    "\n2️⃣ Setting System Setting 'DEFAULT_PLAN_KEY' to 'PRO_TEST'...",
  );
  await setSystemSetting("DEFAULT_PLAN_KEY", "PRO_TEST", 1);
  const updatedPlan = await getSystemSetting("DEFAULT_PLAN_KEY");
  console.log(`   Updated Plan: ${updatedPlan}`);
  if (updatedPlan !== "PRO_TEST") throw new Error("Set failed!");

  // 3. Check Audit
  console.log("\n3️⃣ Checking Audit Log...");
  const audit = await prisma.auditLog.findFirst({
    where: { action: "UPDATE_SYSTEM_SETTING" },
    orderBy: { timestamp: "desc" },
  });
  console.log(`   Latest Audit: ${audit?.action} - ${audit?.details}`);
  if (!audit) throw new Error("Audit Log missing!");

  // 4. Test Lock Mechanism
  console.log("\n4️⃣ Testing Lock Mechanism...");
  // Lock the setting manually via Prisma
  await prisma.systemSetting.update({
    where: { key: "DEFAULT_PLAN_KEY" },
    data: { locked: true },
  });
  console.log("   Locked 'DEFAULT_PLAN_KEY'.");

  try {
    await setSystemSetting("DEFAULT_PLAN_KEY", "HACKED", 1);
    console.error("❌ FAILURE: Setting was modified despite Lock!");
  } catch (e: any) {
    console.log(
      `✅ SUCCESS: Locked setting rejected modification. Error: ${e.message}`,
    );
  }

  // Cleanup: Unlock and Reset
  await prisma.systemSetting.update({
    where: { key: "DEFAULT_PLAN_KEY" },
    data: { locked: false, value: "BASIC" },
  });
  console.log("\n🏁 Phase S1 Verification Complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
