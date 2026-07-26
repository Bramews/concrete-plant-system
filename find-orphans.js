const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findOrphanUsers() {
  try {
    // Find users with no active memberships
    const users = await prisma.user.findMany({
      where: {
        memberships: {
          none: {
            deletedAt: null,
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    console.log(`Found ${users.length} users with no active memberships:`);
    users.forEach((u) => {
      console.log(`- ${u.username} (${u.email}) [ID: ${u.id}]`);
      console.log(
        `  Total Memberships (incl. deleted): ${u.memberships.length}`,
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findOrphanUsers();
