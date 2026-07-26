const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  const sample = roles.find((r) => r.name === "COMPANY_ADMIN");
  console.log(
    "Check COMPANY_ADMIN displayName: " +
      (sample ? sample.displayName : "NOT FOUND"),
  );

  const allArabic = roles.every(
    (r) => /[\u0600-\u06FF]/.test(r.displayName) || r.name === "SYSTEM_OWNER",
  );
  console.log("All Arabic? " + allArabic);

  if (!allArabic) {
    console.log("FAIL: Found non-Arabic names:");
    roles
      .filter(
        (r) =>
          !/[\u0600-\u06FF]/.test(r.displayName) && r.name !== "SYSTEM_OWNER",
      )
      .forEach((r) => console.log(r.name + ": " + r.displayName));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
