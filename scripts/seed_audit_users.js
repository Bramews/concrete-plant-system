const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("--- Seeding Audit Users ---");

  // 1. Find the Model Company
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ name: { contains: "النموذجية" } }, { id: 1 }],
    },
  });

  if (!company) {
    console.error("Model Company not found!");
    process.exit(1);
  }

  console.log(`Found Company: ${company.name} (ID: ${company.id})`);

  const passwordHash = await bcrypt.hash("password123", 10);

  const rolesData = [
    { name: "MANAGER", displayName: "مدير" },
    { name: "LAB_TECH", displayName: "فني مختبر" },
    { name: "OPERATOR", displayName: "مشغل" },
    { name: "SALES", displayName: "مبيعات" },
    { name: "ACCOUNTANT", displayName: "محاسب" },
    { name: "LOGISTICS", displayName: "لوجستيات" },
    { name: "GUARD", displayName: "أمن" },
    { name: "SAFETY", displayName: "سلامة" },
  ];

  for (const r of rolesData) {
    // 1. Ensure Role Exists in this company OR as a System Role
    let roleObj = await prisma.role.findFirst({
      where: {
        AND: [
          { name: r.name },
          { OR: [{ companyId: company.id }, { companyId: null }] },
        ],
      },
    });

    if (!roleObj) {
      console.log(`Creating missing role: ${r.name}`);
      roleObj = await prisma.role.create({
        data: {
          name: r.name,
          displayName: r.displayName,
          companyId: company.id,
          isSystem: false,
        },
      });
    }

    const username = `${r.name.toLowerCase()}_audit`;

    // 2. Upsert User
    const user = await prisma.user.upsert({
      where: { username: username },
      update: {
        password: passwordHash,
        name: `${r.displayName} التدقيق`,
        status: "ACTIVE",
      },
      create: {
        username: username,
        email: `${username}@demo.com`,
        password: passwordHash,
        name: `${r.displayName} التدقيق`,
        status: "ACTIVE",
      },
    });

    // 3. Upsert Membership
    await prisma.membership.upsert({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
      update: {
        roleId: roleObj.id,
        status: "ACTIVE",
      },
      create: {
        userId: user.id,
        companyId: company.id,
        roleId: roleObj.id,
        status: "ACTIVE",
      },
    });
    console.log(`Verified User: ${username} with role ${r.name}`);
  }

  console.log("--- Seeding Complete ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
