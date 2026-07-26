const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  try {
    const order = await prisma.order.create({
      data: {
        orderNumber: "ORD-00015",
        companyId: 1,
        volume: 10,
        date: new Date(),
        status: "PENDING",
      },
    });
    console.log("Created:", order);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
