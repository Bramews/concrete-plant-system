import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log("--- Starting User Migration ---");

  try {
    const users = await prisma.user.findMany({
      where: {
        companyId: { not: null },
      },
      include: {
        company: {
          select: { slug: true },
        },
      },
    });

    console.log(`Found ${users.length} users with company associations.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (!user.company) {
        console.warn(
          `[SKIP] User ${user.id} has companyId ${user.companyId} but company not found.`,
        );
        skippedCount++;
        continue;
      }

      const slug = user.company.slug.toLowerCase();
      const suffix = `@${slug}`;

      if (user.username.toLowerCase().endsWith(suffix)) {
        console.log(`[OK] User ${user.username} already has correct suffix.`);
        skippedCount++;
        continue;
      }

      const newUsername = `${user.username}${suffix}`;

      // Check for conflict
      const conflict = await prisma.user.findUnique({
        where: { username: newUsername },
      });

      if (conflict) {
        console.warn(
          `[CONFLICT] Cannot update ${user.username} to ${newUsername} - Username already exists.`,
        );
        skippedCount++;
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername },
      });

      console.log(
        `[UPDATE] User ${user.id}: ${user.username} -> ${newUsername}`,
      );
      updatedCount++;
    }

    console.log("\n--- Migration Summary ---");
    console.log(`Total processed: ${users.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped/Correct: ${skippedCount}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
