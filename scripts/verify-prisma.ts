import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking Prisma Client...");
  console.log("Prisma keys:", Object.keys(prisma));

  try {
    if (!prisma.user) {
      console.error("CRITICAL: prisma.user is undefined");
    } else {
      const count = await prisma.user.count();
      console.log("User count:", count);
    }

    if (!prisma.invoice) {
      console.error("CRITICAL: prisma.invoice is undefined");
    } else {
      console.log("prisma.invoice exists");
    }

    console.log("Verification Complete");
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}

main();
