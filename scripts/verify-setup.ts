import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up verification data...");

  // 1. Ensure a customer exists
  const customer = await prisma.customer.upsert({
    where: { code: "CUST-VERIFY" },
    update: {},
    create: {
      code: "CUST-VERIFY",
      name: "Verification Customer Ltd.",
      status: "ACTIVE",
    },
  });

  // 2. Ensure a project exists
  const project = await prisma.project.upsert({
    where: { id: 999 },
    update: {},
    create: {
      id: 999,
      name: "Verification Project",
      location: "Verification Site",
      customerId: customer.id,
    },
  });

  // 3. Ensure a MixDesign exists
  const mix = await prisma.mixDesign.upsert({
    where: { code: "B30-VERIFY" },
    update: {},
    create: {
      code: "B30-VERIFY",
      name: "B30 Standard",
      strength: 30,
      ingredients: JSON.stringify({ cement: 350, water: 180, sand: 800 }),
    },
  });

  // 4. Ensure OPC Cement material exists
  await prisma.material.upsert({
    where: { name: "OPC Cement" },
    update: { stock: 5000 },
    create: {
      name: "OPC Cement",
      unit: "kg",
      stock: 5000,
      status: "ACTIVE",
    },
  });

  // 5. Create a DRAFT order for verification
  await prisma.order.create({
    data: {
      orderNumber: `ORD-VERIFY-${Date.now()}`,
      date: new Date(),
      originalQuantity: 50,
      status: "DRAFT",
      customerId: customer.id,
      projectId: project.id,
      mixDesignId: mix.id,
    },
  });

  console.log("Verification data setup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
