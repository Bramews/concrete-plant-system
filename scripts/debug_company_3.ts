import { prisma } from "./lib/prisma";

async function main() {
  const companyId = 3;
  console.log(`Checking Company ${companyId}...`);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      memberships: {
        include: { user: true, role: true },
      },
    },
  });

  if (!company) {
    console.log("Company not found");
    return;
  }

  console.log(`Company found: ${company.name}, Slug: ${company.slug}`);
  console.log(`Memberships count: ${company.memberships.length}`);

  if (company.memberships.length > 0) {
    company.memberships.forEach((m) => {
      console.log(
        `- User: ${m.user.name} (${m.user.email}), Role: ${m.role?.name}, Status: ${m.status}, DeletedAt: ${m.deletedAt}`,
      );
    });
  } else {
    // Check if there are any users with this companyId directly (old schema way?)
    const directUsers = await prisma.user.findMany({
      where: { companyId: companyId },
    });
    console.log(
      `Direct users found (via user.companyId): ${directUsers.length}`,
    );
    directUsers.forEach((u) => console.log(`- ${u.name} (${u.email})`));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
