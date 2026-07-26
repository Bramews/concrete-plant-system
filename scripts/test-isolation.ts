import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testIsolation() {
  console.log("Starting data isolation test...");

  // 1. Create a dummy order for Company 1
  console.log("Creating test order for Company 1...");
  const uniqueOrderNumber = `TEST-ISO-${Date.now()}`;
  const order1 = await prisma.order.create({
    data: {
      companyId: 1,
      orderNumber: uniqueOrderNumber,
      volume: 10,
      date: new Date(),
      status: "DRAFT",
    },
  });

  // 2. Create a CubeTest for this order mentioning Company 1
  console.log("Creating CubeTest for Order 1 with CompanyId 1...");
  const cubeTest = await prisma.cubeTest.create({
    data: {
      orderId: order1.id,
      companyId: 1,
      sampleDate: new Date(),
      age: 7,
      status: "PENDING",
    },
  });

  // 3. Query CubeTest for Company 2 and verify it's not found
  console.log("Querying CubeTest with where: { companyId: 2 }...");
  const isolatedResult = await prisma.cubeTest.findFirst({
    where: {
      id: cubeTest.id,
      companyId: 2,
    },
  });

  if (!isolatedResult) {
    console.log(
      "✅ SUCCESS: Data isolation verified. Record for Company 1 not visible to Company 2.",
    );
  } else {
    console.error(
      "❌ FAILURE: Data leakage detected! Record for Company 1 was returned for Company 2.",
    );
  }

  // Cleanup
  await prisma.cubeTest.delete({ where: { id: cubeTest.id } });
  await prisma.order.delete({ where: { id: order1.id } });

  console.log("Cleanup complete.");
}

testIsolation()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
