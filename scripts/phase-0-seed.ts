import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "owner@system.local";
  const password = "admin";

  console.log("Seeding System Owner...");

  try {
    const owner = await prisma.systemOwner.upsert({
      where: { email },
      update: { password },
      create: {
        email,
        password,
        name: "Root Sovereign",
      },
    });
    console.log("System Owner seeded:", owner.email);
  } catch (e) {
    console.error("Seeding failed:", e);
    process.exit(1);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
