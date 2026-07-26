const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

p.role
  .findMany({ where: { companyId: null }, orderBy: { name: "asc" } })
  .then((roles) => {
    console.log("Total Roles:", roles.length);
    roles.forEach((r) =>
      console.log(
        `${r.name} -> ${r.displayName} [${r.isSystem ? "S" : "-"}${r.isSovereign ? "O" : "-"}]`,
      ),
    );
    return p.permission.count();
  })
  .then((count) => {
    console.log("\nTotal Permissions:", count);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error("Error:", e.message);
    p.$disconnect();
  });
