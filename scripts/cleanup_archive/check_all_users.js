const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- Checking User table ---");
  const users = await prisma.user.findMany({
    include: {
      company: true,
      department: true,
    },
  });
  if (users.length === 0) {
    console.log("No regular users found.");
  } else {
    users.forEach((u) => {
      console.log(
        `ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Company: ${u.company?.name || "N/A"}, Dept: ${u.department?.displayName || "N/A"}`,
      );
    });
  }

  console.log("\n--- Checking SystemOwner table ---");
  const owners = await prisma.systemOwner.findMany();
  if (owners.length === 0) {
    console.log("No system owners found.");
  } else {
    owners.forEach((o) => {
      console.log(`ID: ${o.id}, Email: ${o.email}, Name: ${o.name}`);
    });
  }

  console.log("\n--- Checking Company table ---");
  const companies = await prisma.company.findMany();
  if (companies.length === 0) {
    console.log("No companies found.");
  } else {
    companies.forEach((c) => {
      console.log(`ID: ${c.id}, Name: ${c.name}, Slug: ${c.slug}`);
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
