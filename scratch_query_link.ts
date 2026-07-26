import { PrismaClient } from "@prisma/client";
const rawPrisma = new PrismaClient();

async function main() {
  // 1. Update companyId for cube tests of Order 4
  const updatedTests = await rawPrisma.cubeTest.updateMany({
    where: { orderId: 4 },
    data: { companyId: 1 },
  });
  console.log("Updated Tests:", updatedTests);

  // 2. Create mock batches to sum up to 18 m³ (the total order volume)
  const existingBatchesCount = await rawPrisma.batch.count({
    where: { orderId: 4 },
  });

  if (existingBatchesCount === 0) {
    const b1 = await rawPrisma.batch.create({
      data: {
        orderId: 4,
        quantity: 10.0,
        actualMixData: "{}",
        companyId: 1,
        createdAt: new Date(),
      },
    });
    const b2 = await rawPrisma.batch.create({
      data: {
        orderId: 4,
        quantity: 8.0,
        actualMixData: "{}",
        companyId: 1,
        createdAt: new Date(),
      },
    });
    console.log("Created Batches:", b1, b2);
  }
}

main()
  .catch(console.error)
  .finally(() => rawPrisma.$disconnect());
