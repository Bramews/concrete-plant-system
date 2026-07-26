import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Manager Scenarios...");

  // 1. Ensure Manager User
  const managerEmail = "manager@example.com";
  const managerPassword = await hash("password123", 10);

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      email: managerEmail,
      name: "Site Manager",
      username: "manager_demo",
      password: managerPassword,
      status: "ACTIVE",
      role: {
        connectOrCreate: {
          where: { name: "MANAGER" },
          create: { name: "MANAGER", displayName: "Manager", isSystem: true },
        },
      },
    },
  });
  console.log("👤 Manager User Ready:", manager.email);

  // 2. Materials (Various States)
  const materials = [
    { name: "Cement-Type1", stock: 50000, status: "ACTIVE" }, // OK
    { name: "Sand-River", stock: 200, status: "ACTIVE" }, // LOW
    { name: "Agg-20mm", stock: 0, status: "ACTIVE" }, // ZERO
    { name: "Admixture-X", stock: 1000, status: "ACTIVE" }, // OK
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { name: m.name },
      update: { stock: m.stock },
      create: {
        name: m.name,
        code: m.name.toUpperCase(),
        unit: "kg",
        stock: m.stock,
      },
    });
  }
  console.log("📦 Materials Seeded");

  // 3. Lab Rejection (Critical Alert)
  // Find a material to reject (Admixture-X)
  const rejectedMat = await prisma.material.findFirst({
    where: { name: "Admixture-X" },
  });
  if (rejectedMat) {
    // Check if pending rejection exists
    const existingRejection = await prisma.materialRejection.findFirst({
      where: { materialId: rejectedMat.id, status: "PENDING" },
    });

    if (!existingRejection) {
      // We need a Lab User
      const labUser = await prisma.user.upsert({
        where: { email: "lab@example.com" },
        update: {},
        create: {
          email: "lab@example.com",
          name: "Lab Tech",
          username: "lab_demo",
          password: managerPassword,
          status: "ACTIVE",
          role: {
            connectOrCreate: {
              where: { name: "LAB_TECH" },
              create: {
                name: "LAB_TECH",
                displayName: "Lab Technician",
                isSystem: true,
              },
            },
          },
        },
      });

      await prisma.materialRejection.create({
        data: {
          materialId: rejectedMat.id,
          labUserId: labUser.id,
          comments: "Contamination detected in batch #99",
          status: "PENDING",
        },
      });
      console.log("⚠️ Lab Rejection Created");
    }
  }

  // 4. Active Order (for Attention Check)
  const customer = await prisma.customer.upsert({
    where: { code: "CUST-001" },
    update: {},
    create: {
      name: "Demo Construction Co",
      code: "CUST-001",
      phone: "555-0100",
    },
  });

  const project = await prisma.project.upsert({
    where: { code: "PROJ-001" },
    update: {},
    create: {
      name: "Skyline Tower",
      code: "PROJ-001",
      customerId: customer.id,
      location: "Downtown",
    },
  });

  // Mix Design using the Rejected Material (Edge Case Test)
  const mixDetails = JSON.stringify({
    "Cement-Type1": 300,
    "Sand-River": 700,
    "Admixture-X": 5, // This is rejected!
  });

  const mix = await prisma.mixDesign.upsert({
    where: { code: "MIX-C30" },
    update: { details: mixDetails, status: "APPROVED" },
    create: {
      code: "MIX-C30",
      grade: "C30",
      name: "Standard C30",
      status: "APPROVED",
      details: mixDetails,
      customerId: customer.id,
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      projectId: project.id,
      mixDesignId: mix.id,
      orderNumber: `ORD-${Date.now()}`,
      volume: 50,
      status: "PENDING_APPROVAL",
      deliveryDate: new Date(),
      deliveryLocation: "Site A",
    },
  });
  console.log("📝 Order Created (Uses Rejected Material):", order.orderNumber);

  console.log("✅ Seeding Complete. Use 'manager@example.com' / 'password123'");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
