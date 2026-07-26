import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- 🔴 CHECK 1: TEST LEAK (Should Fail) ---");
  try {
    // This simulates a "rogue" call without any headers/context
    const materials = await prisma.material.findMany();
    console.log("❌ FAIL: Guard Leaked Data! Found:", materials.length);
    process.exit(1); // Fail
  } catch (e: any) {
    if (e.message.includes("Context Missing & No Explicit ID")) {
      console.log("✅ PASS: Guard blocked rogue request.");
    } else {
      console.log("⚠️  BLOCKED with unexpected error:", e.message);
    }
  }

  console.log("\n--- 🔴 CHECK 2: SYSTEM_OWNER BYPASS ---");
  // We cannot easily simulate "headers()" here because it's a server component thing.
  // BUT our Guard logic says: "if (!headersList) -> Check args".
  // So simulation of SYSTEM_OWNER bypass via *script* is tricky unless we mock the module.
  // However, we can check basic script allowed behavior (Explicit ID).

  try {
    // Script Context with Explicit ID (Simulating Admin working on specific company)
    await prisma.material.findMany({ where: { companyId: 1 } });
    console.log("✅ PASS: Explicit CompanyID allowed in script context.");
  } catch (e) {
    console.log("❌ FAIL: Explicit CompanyID blocked in script:", e);
  }
}

main();
