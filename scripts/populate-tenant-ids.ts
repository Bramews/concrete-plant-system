import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting tenant data population...");

  // 1. Populating CubeTest
  console.log("Updating CubeTest...");
  const cubeTests = await prisma.cubeTest.findMany({
    where: { companyId: null },
    include: { order: true },
  });
  for (const test of cubeTests) {
    if (test.order?.companyId) {
      await prisma.cubeTest.update({
        where: { id: test.id },
        data: { companyId: test.order.companyId },
      });
    }
  }

  // 2. Populating SieveAnalysis
  console.log("Updating SieveAnalysis...");
  const sieveTests = await prisma.sieveAnalysis.findMany({
    where: { companyId: null },
    include: { material: true },
  });
  for (const test of sieveTests) {
    if (test.material?.companyId) {
      await prisma.sieveAnalysis.update({
        where: { id: test.id },
        data: { companyId: test.material.companyId },
      });
    }
  }

  // 3. Populating MixComponent
  console.log("Updating MixComponent...");
  const components = await prisma.mixComponent.findMany({
    where: { companyId: null },
    include: { mixDesign: true },
  });
  for (const comp of components) {
    if (comp.mixDesign?.companyId) {
      await prisma.mixComponent.update({
        where: { id: comp.id },
        data: { companyId: comp.mixDesign.companyId },
      });
    }
  }

  // 4. Populating LabApproval
  console.log("Updating LabApproval...");
  const approvals = await prisma.labApproval.findMany({
    where: { companyId: null },
    include: { order: true },
  });
  for (const app of approvals) {
    if (app.order?.companyId) {
      await prisma.labApproval.update({
        where: { id: app.id },
        data: { companyId: app.order.companyId },
      });
    }
  }

  // 5. Populating Batch
  console.log("Updating Batch...");
  const batches = await prisma.batch.findMany({
    where: { companyId: null },
    include: { order: true },
  });
  for (const b of batches) {
    if (b.order?.companyId) {
      await prisma.batch.update({
        where: { id: b.id },
        data: { companyId: b.order.companyId },
      });
    }
  }

  // 6. Populating DeliveryTicket
  console.log("Updating DeliveryTicket...");
  const tickets = await prisma.deliveryTicket.findMany({
    where: { companyId: null },
    include: { order: true },
  });
  for (const t of tickets) {
    if (t.order?.companyId) {
      await prisma.deliveryTicket.update({
        where: { id: t.id },
        data: { companyId: t.order.companyId },
      });
    }
  }

  // 7. Populating QualityTest
  console.log("Updating QualityTest...");
  const qualityTests = await prisma.qualityTest.findMany({
    where: { companyId: null },
    include: { order: true, material: true },
  });
  for (const qt of qualityTests) {
    const cid = qt.order?.companyId || qt.material?.companyId;
    if (cid) {
      await prisma.qualityTest.update({
        where: { id: qt.id },
        data: { companyId: cid },
      });
    }
  }

  console.log("Population complete.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
