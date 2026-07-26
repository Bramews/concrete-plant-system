import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("--- TEST USER CREATION START ---");
  const email = `test_user_${Date.now()}@example.com`;
  const username = `test_user_${Date.now()}`;
  const password = await bcrypt.hash("123456", 10);

  console.log(`Creating user: ${username} (${email})`);

  try {
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email,
        username,
        password,
        status: "ACTIVE", // Explicitly setting ACTIVE
      },
    });

    console.log("User created object form PRISMA RETURN:", user);
    console.log(`ID: ${user.id}, Status: ${user.status}`);

    // Re-fetch to be sure
    const refetched = await prisma.user.findUnique({ where: { id: user.id } });
    console.log("Refetched User from DB:", refetched);
    console.log(`Refetched Status: ${refetched?.status}`);

    if (refetched?.status !== "ACTIVE") {
      console.error(
        "❌ CRITICAL: User status mismatch! Expected ACTIVE, got " +
          refetched?.status,
      );
    } else {
      console.log("✅ SUCCESS: User created cleanly as ACTIVE.");
    }
  } catch (e) {
    console.error("Creation failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
