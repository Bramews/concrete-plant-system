const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
    });

    console.log("TOTAL ROLES:", roles.length);
    roles.forEach((r) => console.log(r.id, r.name, r.isSystem, r.companyId));

    // Write to file for evidence
    const output =
      `TOTAL ROLES: ${roles.length}\n` +
      roles
        .map(
          (r) =>
            `${r.id} ${r.name} isSystem:${r.isSystem} companyId:${r.companyId || "null"}`,
        )
        .join("\n");
    fs.writeFileSync("FINAL_ROLES.txt", output);
    console.log("Output written to FINAL_ROLES.txt");
  } catch (e) {
    console.error(e);
    fs.writeFileSync("FINAL_ROLES_ERROR.txt", e.toString());
  } finally {
    await prisma.$disconnect();
  }
}

main();
