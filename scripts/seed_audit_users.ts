import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Seeding Audit Users ---");

  // 1. Find the Model Company
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ name: { contains: "النموذجية" } }, { slug: "model-company" }],
    },
  });

  if (!company) {
    console.error("Model Company not found!");
    process.exit(1);
  }

  console.log(`Found Company: ${company.name} (ID: ${company.id})`);

  const passwordHash = await bcrypt.hash("password123", 10);

  const roles = [
    { username: "manager_audit", role: "MANAGER", name: "مدير التدقيق" },
    { username: "lab_audit", role: "LAB_TECH", name: "فني التدقيق" },
    { username: "operator_audit", role: "OPERATOR", name: "مشغل التدقيق" },
    { username: "sales_audit", role: "SALES", name: "مبيعات التدقيق" },
    { username: "accountant_audit", role: "ACCOUNTANT", name: "محاسب التدقيق" },
    {
      username: "dispatcher_audit",
      role: "LOGISTICS",
      name: "لوجستيات التدقيق",
    },
  ];

  for (const r of roles) {
    // Upsert User
    const user = await prisma.user.upsert({
      where: { username: r.username },
      update: {
        password: passwordHash,
        name: r.name,
      },
      create: {
        username: r.username,
        email: `${r.username}@demo.com`,
        password: passwordHash,
        name: r.name,
        status: "ACTIVE",
      },
    });

    // Find Role
    const roleObj = await prisma.role.findFirst({
      where: { name: r.role },
    });

    if (roleObj) {
      // Upsert Membership
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
      console.log(`Verified User: ${r.username} with role ${r.role}`);
    } else {
      console.error(`Role ${r.role} not found!`);
    }
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
