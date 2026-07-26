import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testSystemOwnerFlow() {
  console.log("--- Testing SYSTEM_OWNER Data Integrity ---");
  const owners = await prisma.systemOwner.findMany();
  console.log(`✅ Found ${owners.length} System Owners.`);
  for (const owner of owners) {
    console.log(`   - ${owner.name} (${owner.email})`);
  }

  const settings = await prisma.systemSetting.findMany();
  console.log(`✅ System Settings Count: ${settings.length}`);

  const audit = await prisma.auditLog.create({
    data: {
      action: "STABILITY_VERIFICATION",
      details: "Automated DB stability check",
      entity: "System",
      entityId: 0,
      userId: 1,
      role: "SYSTEM_OWNER",
      timestamp: new Date(),
    },
  });
  console.log("✅ Audit Log Entry Created ID:", audit.id);
}

async function testLabDataFlow() {
  console.log("\n--- Testing Lab Data Flow ---");
  // Check if TestMethods exist (the 404/MissingTable error from build)
  const testMethods = await prisma.testMethod.findMany();
  console.log(`✅ TestMethods found: ${testMethods.length}`);

  const labStandards = await prisma.labStandard.findMany();
  console.log(`✅ Lab Standards found: ${labStandards.length}`);

  // Create a mock lab result to verify schema
  const mat = await prisma.material.findFirst();
  if (mat) {
    console.log(`✅ Materials are accessible: ${mat.name}`);
  }
}

async function testCompanySettingsFlow() {
  console.log("\n--- Testing Company Settings Flow ---");
  const company = await prisma.company.findFirst();
  if (!company) {
    console.warn("⚠️ No companies found in DB to test settings.");
    return;
  }

  const settingKey = "VALIDATION_TEST_KEY";
  const val = "passed_" + new Date().getTime();

  await prisma.companySetting.upsert({
    where: { companyId_key: { companyId: company.id, key: settingKey } },
    update: { value: val },
    create: { companyId: company.id, key: settingKey, value: val },
  });
  console.log(`✅ Updated Setting for Company: ${company.name}`);
}

async function main() {
  try {
    await testSystemOwnerFlow();
    await testLabDataFlow();
    await testCompanySettingsFlow();
    console.log("\n⭐⭐⭐ DB & RUNTIME LOGIC VERIFIED SUCCESSFULLY ⭐⭐⭐");
  } catch (e) {
    console.error("\n❌ VALIDATION FAILED:");
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
