import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏭 Starting Industrial Flow Verification...");

  // 1. Setup Context (Company & Users)
  console.log("\n[1] SETUP: Verifying Actors...");
  const company = await prisma.company.findFirst({
    where: { slug: "concrete" },
  });
  if (!company) throw new Error("Seed company 'concrete' not found");

  const sales = await prisma.user.findFirst({
    where: { role: Role.DEPARTMENT_MANAGER, companyId: company.id },
  }); // Acts as Sales/Dept Manager
  const lab = await prisma.user.findFirst({
    where: { role: Role.LAB_TECH, companyId: company.id },
  });
  const operator = await prisma.user.findFirst({
    where: { role: Role.COMPANY_ADMIN, companyId: company.id },
  }); // Manager/Operator

  if (!sales || !lab || !operator)
    throw new Error(
      "Missing required roles (Sales, Lab, Operator) in seed data.",
    );
  console.log("✅ Actors Verified.");

  // 2. Step 1: SALES creates Order
  console.log("\n[2] SALES_OFFICE: Creating Order...");
  const customer = await prisma.customer.findFirst({
    where: { companyId: company.id },
  });
  const project = await prisma.project.findFirst({
    where: { companyId: company.id },
  });
  const mix = await prisma.mixDesign.findFirst({
    where: { companyId: company.id },
  });

  if (!customer || !project || !mix)
    throw new Error("Missing business data (Customer/Project/Mix)");

  const order = await prisma.order.create({
    data: {
      date: new Date(),
      quantity: 50, // m3
      status: "PENDING_LAB",
      customerId: customer.id,
      projectId: project.id,
      mixDesignId: mix.id,
      companyId: company.id,
    },
  });

  // Log Action
  await prisma.auditLog.create({
    data: {
      action: "ORDER_CREATED",
      entity: "ORDER", // Fixed EntityType -> entity
      entityId: order.id, // Fixed Int -> Int
      userId: sales.id,
      role: "SALES",
      details: `Order #${order.id} for 50m3 created by Sales.`,
    },
  });
  console.log(`✅ Order #${order.id} Created [Status: PENDING_LAB]`);

  // 3. Step 2: LAB approves Order
  console.log("\n[3] LAB: Verifying & Approving...");
  // Lab checks Mix
  const labOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (labOrder?.mixDesignId !== mix.id) throw new Error("Mix Design Mismatch");

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "APPROVED" }, // Ready for production
  });

  await prisma.auditLog.create({
    data: {
      action: "ORDER_APPROVED",
      entity: "ORDER",
      entityId: order.id,
      userId: lab.id,
      role: "LAB_TECH",
      details: `Order #${order.id} mix verified and approved by Lab.`,
    },
  });
  console.log(`✅ Order #${order.id} Approved [Status: APPROVED]`);

  // 4. Step 3: PRODUCTION (Operator)
  console.log("\n[4] PLANT: Batching & Loading...");
  // Check stock first (Simulation)
  const cement = await prisma.material.findFirst({ where: { name: "cement" } });
  if (!cement || cement.stock < 500) throw new Error("Insufficient Cement");

  // Deduct Stock
  await prisma.material.update({
    where: { id: cement.id },
    data: { stock: { decrement: 50 * 300 } }, // 300kg per m3
  });

  // Create Batch Record
  const batch = await prisma.batch.create({
    data: {
      orderId: order.id,
      quantity: 10, // First truck 10m3
      actualMixData: "Cement:300kg, AggGap:1000kg, Sand:800kg",
    },
  });

  console.log(`✅ Batch #${batch.id} Produced (10m3). Stock Deducted.`);

  // 5. Step 4: DISPATCH (Ticket)
  console.log("\n[5] DISPATCH: Generatng Ticket...");
  const ticket = await prisma.deliveryTicket.create({
    data: {
      orderId: order.id,
      batchId: batch.id,
      ticketNumber: `T-${batch.id}-${Date.now()}`,
      status: "DISPATCHED",
      truckNumber: "TRUCK-01",
      driverName: "John Doe",
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "IN_PROGRESS" },
  });

  console.log(`✅ Ticket #${ticket.ticketNumber} Issued.`);

  // 6. Step 5: FINANCE (Settlement)
  console.log("\n[6] FINANCE: Invoicing...");
  const totalDelivered = 10;
  const invoiceAmount = totalDelivered * 250;

  await prisma.ledgerEntry.create({
    data: {
      companyId: company.id,
      amount: invoiceAmount,
      type: "CREDIT",
      description: `Invoice for Order #${order.id}`,
    },
  });

  console.log(`✅ Ledger Entry Created: +$${invoiceAmount}`);
  console.log("\n🏭 INDUSTRIAL FLOW VERIFICATION PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
