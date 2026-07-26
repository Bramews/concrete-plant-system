import { prisma } from "@/lib/prisma";
import { getUserSetting, setUserSetting } from "@/lib/user-settings";
import { lockCompanySetting } from "@/lib/company-settings";

async function main() {
  console.log("👤 Verifying Phase S3: User Settings Sovereignty...");

  // Setup: Ensure Company & User exist
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found for testing.");

  // Use a user defined in this company
  const user = await prisma.user.findFirst({
    where: { companyId: company.id },
  });
  if (!user) throw new Error("No user found for testing.");

  const userId = user.id;
  const companyId = company.id;

  console.log(`Testing with User ${userId} in Company ${companyId}`);

  // 1. Test Basic Set/Get
  console.log("\n1️⃣ Setting User 'THEME' to 'dark'...");
  await setUserSetting(userId, "THEME", "dark");
  const theme = await getUserSetting(userId, "THEME");
  console.log(`   Fetched Theme: '${theme}'`);
  if (theme !== "dark") throw new Error("User Setting Set/Get failed!");

  // 2. Test Company Lock Enforcement
  console.log("\n2️⃣ Testing Company Lock Hierarchy...");
  // Lock 'THEME' at company level to 'light'
  // Needs System Owner privilege -> We'll just force DB update or use the lib function if we can mock SysOwner
  // We'll use the lockCompanySetting from lib
  await lockCompanySetting(companyId, "THEME", true, 1);
  // We also need to set the value to 'light' to see the override
  await prisma.companySetting.upsert({
    where: { companyId_key: { companyId, key: "THEME" } },
    update: { value: "light" },
    create: { companyId, key: "THEME", value: "light", locked: true },
  });

  // Verify User gets 'light' (Company Locked) even if User set 'dark' earlier
  const enforcedTheme = await getUserSetting(userId, "THEME");
  console.log(`   Enforced Theme (Should be 'light'): '${enforcedTheme}'`);
  if (enforcedTheme !== "light")
    throw new Error("Company Lock enforcement failed! User value persisted.");

  // 3. Test Block Write on Locked
  console.log("\n3️⃣ Testing Write Block on Locked Setting...");
  try {
    await setUserSetting(userId, "THEME", "blue");
    console.error("❌ FAILURE: User allowed to write to Locked Setting!");
  } catch (e: any) {
    console.log(`✅ SUCCESS: Write blocked. Error: ${e.message}`);
  }

  // 4. Audit Check
  console.log("\n4️⃣ Checking Audit Log...");
  const audit = await prisma.auditLog.findFirst({
    where: {
      action: "UPDATE_USER_SETTING",
      userId: userId,
    },
    orderBy: { timestamp: "desc" },
  });
  console.log(`   Latest Audit: ${audit?.action} - ${audit?.details}`);

  // Cleanup: Unlock
  await lockCompanySetting(companyId, "THEME", false, 1);

  console.log("\n🏁 Phase S3 Verification Complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
