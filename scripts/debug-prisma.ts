import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("DEBUG: Testing Prisma Initialization");
  console.log(
    "DEBUG: DATABASE_URL from process.env:",
    process.env.DATABASE_URL,
  );

  try {
    const userCount = await prisma.user.count();
    console.log("DEBUG: Success! User count:", userCount);
  } catch (e: any) {
    console.error("DEBUG: Failed to connect or query:");
    console.error(e);
  }
}

main();
