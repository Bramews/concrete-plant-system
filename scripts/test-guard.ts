import { PrismaClient } from "@prisma/client";
import { TENANTED_MODELS } from "../lib/tenancy";

// We need to simulate the environment where `prisma` is imported
// But since our prisma instance uses `next/headers`, running this script directly via ts-node might fail
// because `next/headers` is not available outside Next.js context.

// HOWEVER, we wrapped the import in try-catch.
// So in this script, headers() will return undefined.
// This allows us to test the "Fallback / No Context" behavior (Should BLOCK).

import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- STARTING GUARD TEST ---");

  try {
    console.log("1. Trying to fetch Material WITHOUT context (Should Fail)...");
    await prisma.material.findMany({});
    console.log("❌ FAILED: Material fetch succeeded without context!");
  } catch (e: any) {
    if (e.message.includes("Context Missing & No Explicit ID")) {
      console.log("✅ PASSED: Material fetch blocked as expected.");
    } else {
      console.log("❌ FAILED: Blocked but with unexpected error:", e.message);
    }
  }

  try {
    console.log(
      "2. Trying to fetch Material WITH explicit companyId (Should Pass)...",
    );
    // Note: Since we are in a script (no headers), we rely on explicit args.
    // If our logic says "If no headers, check args", this should pass.
    // If our logic says "If no headers, BLOCK", this should fail.
    // Let's check our implementation:
    // "if (!headersList) { return query(args); }"
    // AH! We returned early if no headersList!
    // This means in scripts (cron jobs), it BYPASSES the guard?
    // Let's verify this behavior.

    await prisma.material.findMany({ where: { companyId: 1 } });
    console.log(
      "ℹ️ Script Behavior: Allowed with explicit ID (because headers() failed gracefully).",
    );
  } catch (e: any) {
    console.log("❌ Script Error:", e.message);
  }

  console.log("--- TEST COMPLETE ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // await prisma.$disconnect() // extended client doesn't need explicit disconnect usually, but good practice if base client
  });
