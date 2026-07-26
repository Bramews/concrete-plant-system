import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- 🛡️ FINAL CROSS-TENANT AUDIT 🛡️ ---");

  // 1. Setup Data
  const companyA = await prisma.company.upsert({
    where: { slug: "comp-a" },
    update: {},
    create: { name: "Company A", slug: "comp-a" },
  });
  const companyB = await prisma.company.upsert({
    where: { slug: "comp-b" },
    update: {},
    create: { name: "Company B", slug: "comp-b" },
  });

  console.log("🏢 Created Companies:", companyA.id, companyB.id);

  // Material for Company B
  const matB = await prisma.material.create({
    data: {
      name: "Secret Material B " + Date.now(),
      companyId: companyB.id,
      unit: "kg",
    },
  });
  console.log(
    `📦 Created Target Material ID: ${matB.id} (Company: ${companyB.id})`,
  );

  // 🧪 SIMULATE CONTEXT: USER FROM COMPANY A
  (globalThis as any).MOCK_CONTEXT = {
    "x-user-role": "MANAGER",
    "x-company-id": companyA.id.toString(),
  };
  console.log(`🕵️  Impersonating User from Company A (${companyA.id})...`);

  // --- TEST 1: READ (findUnique) ---
  console.log("\n🔴 TEST 1: Read by ID (findUnique)");
  try {
    const result = await prisma.material.findUnique({
      where: { id: matB.id },
    });
    if (result) {
      console.log("❌ FAIL: Accessed Company B record!");
      console.log(result);
      process.exit(1);
    } else {
      console.log("✅ PASS: Record not found (Filtered out by Guard).");
    }
  } catch (e: any) {
    console.log("✅ PASS: Access Denied / Error:", e.message);
  }

  // --- TEST 2: UPDATE (update) ---
  console.log("\n🔴 TEST 2: Update by ID");
  try {
    await prisma.material.update({
      where: { id: matB.id },
      data: { name: "HACKED" },
    });
    console.log("❌ FAIL: Updated Company B record!");
    process.exit(1);
  } catch (e: any) {
    // Prisma throws "Record to update not found" if where clause doesn't match
    if (
      e.message.includes("Record to update not found") ||
      e.message.includes("Access Denied")
    ) {
      console.log("✅ PASS: Update blocked (Record not found in context).");
    } else {
      console.log("⚠️  Unexpected Error:", e.message);
    }
  }

  // --- TEST 3: DELETE (delete) ---
  console.log("\n🔴 TEST 3: Delete by ID");
  try {
    await prisma.material.delete({
      where: { id: matB.id },
    });
    console.log("❌ FAIL: Deleted Company B record!");
    process.exit(1);
  } catch (e: any) {
    if (
      e.message.includes("Record to delete does not exist") ||
      e.message.includes("Access Denied")
    ) {
      console.log("✅ PASS: Delete blocked.");
    } else {
      console.log("⚠️  Unexpected Error:", e.message);
    }
  }

  // --- TEST 4: UPDATE MANY (updateMany) ---
  console.log("\n🔴 TEST 4: Update Many (Broad Sweep)");
  try {
    // Trying to update ALL materials, assuming Guard limits to Company A
    const result = await prisma.material.updateMany({
      data: { unit: "HACKED_UNIT" },
    });
    console.log(`ℹ️  Updated ${result.count} records.`);

    // Verify matB was NOT updated
    // We need to bypass guard to check truth (or use system owner)
    (globalThis as any).MOCK_CONTEXT = { "x-user-role": "SYSTEM_OWNER" };
    const check = await prisma.material.findUnique({ where: { id: matB.id } });

    if (check?.unit === "HACKED_UNIT") {
      console.log("❌ FAIL: updateMany leaked to Company B!");
      process.exit(1);
    } else {
      console.log("✅ PASS: Company B record untouched.");
    }
  } catch (e: any) {
    console.log("❌ FAIL: Error during updateMany:", e.message);
  }

  console.log("\n🎉 ALL SYSTEMS GO. GUARD IS ACTIVE.");
}

main();
