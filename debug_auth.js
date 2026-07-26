const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debug() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: "cube" }, { email: "cube@11.com" }] },
    include: {
      memberships: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    console.log("User not found");
  } else {
    console.log(
      "User:",
      JSON.stringify(
        {
          id: user.id,
          username: user.username,
          name: user.name,
          status: user.status,
          companyId: user.companyId,
        },
        null,
        2,
      ),
    );

    console.log(
      "Memberships:",
      JSON.stringify(
        user.memberships.map((m) => ({
          companyId: m.companyId,
          role: m.role.name,
          status: m.status,
          deletedAt: m.deletedAt,
        })),
        null,
        2,
      ),
    );
  }

  const prefs = await prisma.$queryRaw`PRAGMA table_info(UserPreference)`;
  console.log("UserPreference Table Info:", prefs);

  await prisma.$disconnect();
}

debug();
