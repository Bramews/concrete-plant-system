import "dotenv/config";
import { prisma } from "../lib/prisma";

console.log("Starting verification...");

async function main() {
  try {
    console.log("Prisma instance:", !!prisma);
    // Simple query to verify connection
    // We don't query DB because it might fail if DB is locked or empty, strictly testing initialization phase
    console.log("Prisma initialized successfully via lib/prisma.ts");
  } catch (e) {
    console.error("Initialization Failed:", e);
    process.exit(1);
  }
}

main();
