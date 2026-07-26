import { prisma } from "@/lib/prisma";
import {
  getSystemSetting,
  setSystemSetting,
  getCompanySetting,
  setCompanySetting,
  getUserSetting,
  setUserSetting,
} from "@/lib/settings";

async function main() {
  console.log("⚙️ Starting Settings Verification...");

  // 1. System Setting
  console.log("1️⃣ Testing System Settings...");
  const initialPlan = await getSystemSetting("DEFAULT_PLAN");
  console.log("Initial Default Plan:", initialPlan);

  await setSystemSetting("DEFAULT_PLAN", "PRO_TEST", 1); // Mock User 1
  const updatedPlan = await getSystemSetting("DEFAULT_PLAN");
  console.log("Updated Default Plan:", updatedPlan);

  // 2. Company Setting
  console.log("2️⃣ Testing Company Settings...");
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found for testing");
  const companyId = company.id;
  const initialLang = await getCompanySetting(companyId, "LANGUAGE");
  console.log("Initial Company Language:", initialLang);

  await setCompanySetting(companyId, "LANGUAGE", "en", 1);
  const updatedLang = await getCompanySetting(companyId, "LANGUAGE");
  console.log("Updated Company Language:", updatedLang);

  // 3. User Setting (Cascade)
  console.log("3️⃣ Testing User Settings Cascade...");
  const user = await prisma.user.findFirst({ where: { companyId: companyId } });
  if (!user) throw new Error("No user found in company for testing");
  const userId = user.id;

  // Clear User Setting if exists
  await prisma.userSetting.deleteMany({ where: { userId, key: "LANGUAGE" } });

  // Should fallback to Company (which we set to 'en')
  const userCascadeLang = await getUserSetting(userId, "LANGUAGE");
  console.log("User Language (Cascade from Company 'en'):", userCascadeLang);

  if (userCascadeLang !== "en") {
    console.error("❌ Cascade Failed! Expected 'en', got:", userCascadeLang);
  } else {
    console.log("✅ Cascade Verified.");
  }

  // Set User Specific
  await setUserSetting(userId, "LANGUAGE", "fr");
  const userSpecificLang = await getUserSetting(userId, "LANGUAGE");
  console.log("User Language (Specific 'fr'):", userSpecificLang);

  // 4. Audit Check
  const audits = await prisma.auditLog.findMany({
    where: { action: { contains: "SETTING" } },
    orderBy: { timestamp: "desc" },
    take: 2,
  });
  console.log("Recent Setting Audits:", audits.length);
  console.log(audits.map((a) => `${a.action}: ${a.details}`));

  console.log("🏁 Settings Verification Complete.");
}

main();
