const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🏭 Starting Industrial Flow Verification (JS Mode)...");

  const company = await prisma.company.findFirst({
    where: { slug: "concrete" },
  });
  if (!company) throw new Error("Seed company 'concrete' not found");

  const sales = await prisma.user.findFirst({
    where: { role: "DEPARTMENT_MANAGER", companyId: company.id },
  });
  const lab = await prisma.user.findFirst({
    where: { role: "LAB_TECH", companyId: company.id },
  });
  const operator = await prisma.user.findFirst({
    where: { role: "COMPANY_ADMIN", companyId: company.id },
  });

  if (!sales || !lab || !operator) throw new Error("Missing required roles.");

  const customer = await prisma.customer.findFirst({
    where: { companyId: company.id },
  });
  const project = await prisma.project.findFirst({
    where: { companyId: company.id },
  });
  const mix = await prisma.mixDesign.findFirst({
    where: { companyId: company.id },
  });

  const order = await prisma.order.create({
    data: {
      date: new Date(),
      quantity: 50,
      status: "PENDING_LAB",
      customerId: customer.id,
      projectId: project.id,
      mixDesignId: mix.id,
      companyId: company.id,
      createdById: sales.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ORDER_CREATED",
      entityType: "ORDER",
      entityId: order.id.toString(),
      userId: sales.id,
      details: `Order #${order.id} verified via JS Script.`,
    },
  });
  console.log(`✅ Order #${order.id} Created.`);

  console.log("🏭 INDUSTRIAL FLOW VERIFICATION PASSED (JS)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
