import { prisma } from "./lib/prisma";

async function getStats() {
  const [orderCount, mixCount, userCount, companyCount] = await Promise.all([
    prisma.order.count({ where: { companyId: 1 } }),
    prisma.mixDesign.count({ where: { companyId: 1 } }),
    prisma.user.count({ where: { companyId: 1 } }),
    prisma.company.count(),
  ]);

  console.log(`ORDER_COUNT: ${orderCount}`);
  console.log(`MIX_COUNT: ${mixCount}`);
  console.log(`USER_COUNT: ${userCount}`);
  console.log(`COMPANY_COUNT: ${companyCount}`);
}

getStats().catch(console.error);
