const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkCompanyMemberships() {
  const companyId = 2; // From screenshot context
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        memberships: {
          include: { user: true, role: true },
        },
      },
    });

    console.log(`Company: ${company.name} (ID: ${company.id})`);
    console.log("Memberships:", company.memberships.length);

    company.memberships.forEach((m) => {
      console.log(`- User: ${m.user.username} (ID: ${m.user.id})`);
      console.log(`  Role: ${m.role.name}`);
      console.log(`  Status: ${m.status}`); // Membership status
      console.log(`  User Status: ${m.user.status}`);
      console.log(`  DeletedAt: ${m.deletedAt}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanyMemberships();
