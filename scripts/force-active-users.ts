import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- FORCE ACTIVE USERS START ---");

  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: "PENDING" },
    });

    console.log(`Found ${pendingUsers.length} PENDING users.`);

    if (pendingUsers.length > 0) {
      const updateResult = await prisma.user.updateMany({
        where: { status: "PENDING" },
        data: { status: "ACTIVE" },
      });
      console.log(`✅ Updated ${updateResult.count} users to ACTIVE.`);
    } else {
      console.log("No pending users found to update.");
    }

    // Also check for users with valid companyId but no active membership
    // This is a common issue with "ghost" users
  } catch (e) {
    console.error("Force update failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
