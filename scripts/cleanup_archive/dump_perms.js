const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  console.log("Dumping permissions...");
  try {
    const perms = await prisma.permission.findMany({ orderBy: { id: "asc" } });
    fs.writeFileSync("perms_dump.json", JSON.stringify(perms, null, 2));
    console.log(`Dumped ${perms.length} permissions.`);

    const rolePerms = await prisma.rolePermission.findMany({
      include: { role: true, permission: true },
    });
    fs.writeFileSync(
      "role_perms_dump.json",
      JSON.stringify(rolePerms, null, 2),
    );
    console.log(`Dumped ${rolePerms.length} role-permission mappings.`);
  } catch (e) {
    fs.writeFileSync("perms_dump_error.txt", e.toString());
    console.error(e);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
