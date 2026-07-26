const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const companyId = 1; // Demo Plant

  // 1. Find or create a customer
  let customer = await prisma.customer.findFirst({ where: { companyId } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "شركة الإنشاءات الكبرى", companyId },
    });
  }

  // 2. Find or create a mix design
  let mix = await prisma.mixDesign.findFirst({
    where: { companyId, status: "APPROVED" },
  });
  if (!mix) {
    mix = await prisma.mixDesign.create({
      data: {
        name: "C30/37 Foundations",
        code: "C30-F1",
        strengthClass: "C30",
        status: "APPROVED",
        companyId,
      },
    });
  }

  // 3. Create an Order
  const order = await prisma.order.create({
    data: {
      orderNumber: "ORD-DEMO-SC-" + Date.now(),
      companyId,
      customerId: customer.id,
      mixDesignId: mix.id,
      volume: 100,
      date: new Date(),
      status: "APPROVED",
    },
  });

  // 4. Create a Batch (Required for DeliveryTicket)
  const batch = await prisma.batch.create({
    data: {
      orderId: order.id,
      quantity: 6.0,
      actualMixData: JSON.stringify({ water: 150, cement: 300 }),
      companyId,
    },
  });

  // 5. Create a Delivery Ticket
  const ticket = await prisma.deliveryTicket.create({
    data: {
      ticketNumber: "TKT-DEMO-" + Math.floor(Math.random() * 10000),
      orderId: order.id,
      batchId: batch.id,
      truckNumber: "TNT-001",
      driverName: "أحمد محمد",
      status: "DISPATCHED",
      cumulativeQuantity: 6.0,
      companyId,
    },
  });

  // 6. Create some Cube Tests (7-day results to test AI 28-day prediction)
  const sampleDate = new Date();
  sampleDate.setDate(sampleDate.getDate() - 7);

  const cubeTest = await prisma.cubeTest.create({
    data: {
      orderId: order.id,
      sampleDate,
      age: 7,
      kn: 345,
      mpa: 30.6,
      status: "APPROVED",
      companyId,
    },
  });

  console.log(
    `Successfully seeded Demo Data: Order ${order.id}, Batch ${batch.id}, Ticket ${ticket.id}, Cube Test ID ${cubeTest.id}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
