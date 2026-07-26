import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying User Data...");

  const userCount = await prisma.user.count();
  console.log(`Total Users: ${userCount}`);

  if (userCount > 0) {
    const admin = await prisma.user.findFirst({
      where: { username: "Ahmed" },
    });

    if (admin) {
      console.log("✅ Admin User found:");
      console.log(`   - Username: ${admin.username}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Status: ${admin.status}`);
      console.log(
        `   - Roles: ${(await prisma.membership.findMany({ where: { userId: admin.id }, include: { role: true } })).map((m) => m.role.name).join(", ")}`,
      );
    } else {
      console.log("❌ Admin User 'Ahmed' NOT found!");
    }
  } else {
    console.log("❌ Database is EMPTY. Seed probably failed.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
