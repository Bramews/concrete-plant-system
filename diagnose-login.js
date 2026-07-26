const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
  const usernames = ["cube", "55"];

  console.log("--- Diagnostic Report ---");

  for (const username of usernames) {
    console.log(`\n🔍 Checking User: ${username}`);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }, // In case '55' is part of an email? Unlikely but safe.
        ],
      },
      include: {
        memberships: {
          include: { role: true, company: true },
        },
      },
    });

    if (!user) {
      console.log("❌ User not found.");
      continue;
    }

    console.log(`   ID: ${user.id}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   CompanyId (Direct): ${user.companyId}`);
    console.log(
      `   Password Hash (First 10 chars): ${user.password.substring(0, 10)}...`,
    );

    if (user.memberships.length === 0) {
      console.log("   ❌ No Memberships found!");
    } else {
      console.log(`   Found ${user.memberships.length} memberships:`);
      user.memberships.forEach((m) => {
        console.log(`     - Company: ${m.company.name} (ID: ${m.companyId})`);
        console.log(`       Role: ${m.role.name} (ID: ${m.roleId})`);
        console.log(`       Status: ${m.status}`);
        console.log(`       DeletedAt: ${m.deletedAt ? m.deletedAt : "NULL"}`);
      });
    }
  }
}

checkUsers()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
