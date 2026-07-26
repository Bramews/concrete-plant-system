const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

try {
  const model = prisma._dmmf.modelMap.Order;
  if (!model) {
    console.log("Order model not found!");
  } else {
    const hasApproval = model.fields.some((f) => f.name === "approval");
    console.log(`Order model has 'approval' field: ${hasApproval}`);

    const hasOrderNumber = model.fields.some((f) => f.name === "orderNumber");
    console.log(`Order model has 'orderNumber' field: ${hasOrderNumber}`);
  }
} catch (e) {
  console.error("Error inspecting Prisma Client:", e);
} finally {
  prisma.$disconnect();
}
