const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const USERNAME = "cube";
  const PASSWORD = "123";

  console.log("🧹 Final strict cleanup for " + USERNAME + "...");

  // 1. Delete all existing cube records
  await prisma.user.deleteMany({ where: { username: USERNAME } });
  await prisma.session.deleteMany({}); // Clear all sessions for absolute clean start

  // 2. Find necessary data
  const company = await prisma.company.findFirst({
    where: { slug: "concrete" },
  });
  const managerRole = await prisma.role.findFirst({
    where: { name: "COMPANY_ADMIN" },
  });

  if (!company || !managerRole) {
    console.error(
      "❌ Required seed data (company/role) missing! Please run seed first.",
    );
    process.exit(1);
  }

  // 3. Create clean user
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const newUser = await prisma.user.create({
    data: {
      username: USERNAME,
      name: "Sovereign Cube",
      email: "cube@concrete.com",
      password: hashedPassword,
      plainPassword: PASSWORD,
      status: "ACTIVE",
      companyId: company.id,
      canCreateUsers: true,
      memberships: {
        create: {
          companyId: company.id,
          roleId: managerRole.id,
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("✅ User " + USERNAME + " created successfully!");
  console.log("   ID: " + newUser.id);
  console.log("   Status: " + newUser.status);
  console.log("🚀 Environment is now CLEAN.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
