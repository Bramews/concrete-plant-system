import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { preferences: true },
  });

  console.log(`Checking ${users.length} users...`);

  for (const user of users) {
    if (!user.preferences) {
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          theme: "neon",
          language: "ar",
          sidebar: "open",
        },
      });
      console.log(`Created preferences for user: ${user.username}`);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
