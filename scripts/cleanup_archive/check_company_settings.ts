import { prisma } from "@/lib/prisma";
import {
  getCompanySetting,
  setCompanySetting,
  lockCompanySetting,
} from "@/lib/company-settings";
import { getSystemSetting } from "@/lib/system-settings";

async function main() {
  console.log("🏭 Verifying Phase S2: Company Settings Sovereignty...");

  // Setup: Ensure Company 1 exists
  const company = await prisma.company.upsert({
    where: { slug: "test-corp" },
    update: {},
    create: {
      name: "Test Corp",
      slug: "test-corp",
      status: "ACTIVE",
    },
  });
  const companyId = company.id;

  // 1. Check Default (Cascading or Code Default)
  // 'BRAND_NAME' is not in System Settings, so it should be "" (default from code) or local.
  const initialBrand = await getCompanySetting(companyId, "BRAND_NAME");
  console.log(`1️⃣ Initial Brand Name: '${initialBrand}'`);

  // 2. Set Company Setting
  console.log("\n2️⃣ Setting 'BRAND_NAME' to 'Acme Inc'...");
  await setCompanySetting(companyId, "BRAND_NAME", "Acme Inc", 1);
  const updatedBrand = await getCompanySetting(companyId, "BRAND_NAME");
  console.log(`   Updated Brand Name: '${updatedBrand}'`);
  if (updatedBrand !== "Acme Inc") throw new Error("Set failed!");

  // 3. Test Lock (System Owner Only)
  console.log("\n3️⃣ Testing Lock Mechanism...");
  await lockCompanySetting(companyId, "BRAND_NAME", true, 1); // Mock System Owner
  console.log("   Locked 'BRAND_NAME'.");

  try {
    // Attempt modification as Company Admin (should fail if blocked by service logic)
    // currently setCompanySetting throws if locked, UNLESS isSystemOwner flag is true.
    await setCompanySetting(companyId, "BRAND_NAME", "Hacked Brand", 2, false); // User 2, isSystemOwner=false
    console.error("❌ FAILURE: Setting was modified despite Lock!");
  } catch (e: any) {
    console.log(
      `✅ SUCCESS: Locked setting rejected modification. Error: ${e.message}`,
    );
  }

  // 4. Test System Override / Unlock
  // System Owner CAN modify locked setting?
  // User Rule: "If locked = true -> No edit even from Admin".
  // Implies System Owner CAN edit?
  // My service layer: "if existing.locked && !isSystemOwner -> Throw".
  // So System Owner (true) CAN edit.
  console.log("\n4️⃣ System Owner Override...");
  await setCompanySetting(
    companyId,
    "BRAND_NAME",
    "System Enforced Brand",
    1,
    true,
  ); // isSystemOwner=true
  const overrideBrand = await getCompanySetting(companyId, "BRAND_NAME");
  console.log(`   Override Brand: '${overrideBrand}'`);
  if (overrideBrand !== "System Enforced Brand")
    throw new Error("System Owner override failed!");

  // 5. Audit Check
  console.log("\n5️⃣ Checking Audit Log...");
  const audit = await prisma.auditLog.findFirst({
    where: {
      action: "UPDATE_COMPANY_SETTING",
      entityId: companyId,
    },
    orderBy: { timestamp: "desc" },
  });
  console.log(`   Latest Audit: ${audit?.action} - ${audit?.details}`);
  if (!audit) throw new Error("Audit Log missing!");

  console.log("\n🏁 Phase S2 Verification Complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
