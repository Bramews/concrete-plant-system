const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const companyId = 1;

  const staff = [
    {
      email: "accountant@demo.com",
      name: "المحاسب المالي",
      role: "ACCOUNTANT",
    },
    { email: "lab@demo.com", name: "فني المختبر", role: "LAB_MANAGER" },
    { email: "sales@demo.com", name: "مسؤول المبيعات", role: "SALES_MANAGER" },
    {
      email: "logistics@demo.com",
      name: "مسؤول اللوجستيات",
      role: "LOGISTICS_MANAGER",
    },
    {
      email: "inventory@demo.com",
      name: "أمين المخزن",
      role: "INVENTORY_MANAGER",
    },
  ];

  for (const s of staff) {
    try {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: { plainPassword: "123" },
        create: {
          username: s.email.split("@")[0],
          email: s.email,
          name: s.name,
          password: "hashed_password_placeholder", // Should use real hash if possible
          plainPassword: "123",
          companyId: companyId,
        },
      });

      // Find or create role
      let role = await prisma.role.findFirst({
        where: { companyId: companyId, name: s.role },
      });
      if (!role) {
        role = await prisma.role.findFirst({
          where: { isSystem: true, name: s.role },
        });
      }

      if (role) {
        await prisma.membership.upsert({
          where: {
            userId_companyId: { userId: user.id, companyId: companyId },
          },
          update: { roleId: role.id },
          create: {
            userId: user.id,
            companyId: companyId,
            roleId: role.id,
            status: "ACTIVE",
          },
        });
        console.log(`Updated/Created staff: ${s.name} (${s.role})`);
      } else {
        console.log(`Role ${s.role} not found for ${s.name}`);
      }
    } catch (e) {
      console.error(`Error creating ${s.email}:`, e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
