const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Order Cycle Verification (JS)...");

  // 1. Setup Data (Company, User, Customer, Project, Mix)
  console.log("📦 Setting up prerequisites...");

  const company = await prisma.company.upsert({
    where: { subdomain: "verify-test" },
    update: {},
    create: {
      name: "Verification Concrete Co",
      subdomain: "verify-test",
      logoText: "VCC",
      slug: "verify-test-slug", // Make sure slug is unique too if needed
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "verify@test.com" },
    update: {},
    create: {
      email: "verify@test.com",
      username: "verify_bot",
      name: "Verifier Bot",
      password: "hash",
      role: "SYSTEM_OWNER",
      companyId: company.id,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: "Test Customer " + Date.now(),
    },
  });

  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      name: "Test Project " + Date.now(),
      status: "ACTIVE",
    },
  });

  const mix = await prisma.mixDesign.create({
    data: {
      companyId: company.id,
      name: "Test Mix C30",
      code: "C30-TEST-" + Date.now(),
      strengthClass: "C30",
      status: "APPROVED",
      details: JSON.stringify({
        proportions: { cement: 350, water: 180, agg10: 800 },
      }),
    },
  });

  // 2. Create Order
  console.log("📝 Creating Order...");
  const order = await prisma.order.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      projectId: project.id,
      mixDesignId: mix.id,
      volume: 100,
      date: new Date(),
      status: "PENDING",
    },
  });
  console.log(`✅ Order Created: ${order.id}`);

  // 3. Lab Approval
  console.log("🧪 Approving Order (Lab)...");

  // Verify LabApproval Relation
  const approval = await prisma.labApproval.create({
    data: {
      orderId: order.id,
      approvedById: user.id,
      status: "APPROVED", // Add status field which is required in LabApproval
      details: "Automated Verification Approval",
      mixData: JSON.stringify({
        proportions: { cement: 350, water: 180, agg10: 800 },
      }),
    },
  });

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "LAB_APPROVED" },
    include: { approval: true }, // Check relation exists
  });

  if (!updatedOrder.approval) {
    throw new Error("❌ Order -> LabApproval relation missing!");
  }
  console.log("✅ Order Approved & Relation Verified");

  // 4. Production (Batching)
  console.log("🏭 Executing Production (Batch)...");

  // Create Material for stock check
  const cement = await prisma.material.upsert({
    where: { id: 99999 }, // Hack to ensure we have a material to update, or just create one with unique name
    update: { stock: 10000 },
    create: {
      name: "cement-verify-" + Date.now(),
      unit: "kg",
      stock: 10000,
      status: "ACTIVE",
    },
  });

  const batchQty = 10;

  const batch = await prisma.batch.create({
    data: {
      orderId: order.id,
      quantity: batchQty,
      actualMixData: JSON.stringify({ cement: 3500 }), // 350 * 10
    },
  });

  // Deduct Stock
  await prisma.material.update({
    where: { id: cement.id },
    data: { stock: { decrement: 3500 } },
  });

  await prisma.deliveryTicket.create({
    data: {
      ticketNumber: `TKT-${Date.now()}`,
      orderId: order.id,
      batchId: batch.id,
      truckNumber: "TRUCK-01",
      driverName: "John Doe",
      status: "DISPATCHED",
      cumulativeQuantity: batchQty,
    },
  });

  // Update Order Status
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PRODUCTION",
      actualQuantity: batchQty,
    },
  });

  console.log("✅ Batch & Ticket Created. Order moved to PRODUCTION.");

  console.log("🎉 VERIFICATION SUCCESSFUL!");
}

main()
  .catch((e) => {
    console.error("❌ Verification Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
