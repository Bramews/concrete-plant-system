// prisma/seed-plans.ts
import { prisma } from "../lib/prisma";

async function seedPlans() {
  console.log("🌱 Seeding Plans...");

  await prisma.plan.createMany({
    skipDuplicates: true,
    data: [
      {
        key: "BASIC",
        name: "Basic",
        description: "خطة أساسية للشركات الصغيرة",
        maxUsers: 5,
        maxStorage: 1024, // MB
        maxOrders: 500,
        maxProjects: 3,
        features: JSON.stringify(["ORDERS", "CUSTOMERS", "BASIC_REPORTS"]),
      },
      {
        key: "PRO",
        name: "Pro",
        description: "خطة احترافية",
        maxUsers: 25,
        maxStorage: 10240,
        maxOrders: 5000,
        maxProjects: 20,
        features: JSON.stringify([
          "ORDERS",
          "CUSTOMERS",
          "PROJECTS",
          "ADVANCED_REPORTS",
          "API_ACCESS",
        ]),
      },
      {
        key: "ENTERPRISE",
        name: "Enterprise",
        description: "خطة غير محدودة",
        maxUsers: 9999,
        maxStorage: 999999,
        maxOrders: 999999,
        maxProjects: 999999,
        features: JSON.stringify(["ALL_FEATURES"]),
      },
    ],
  });

  console.log("✅ Plans seeded");
}

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
