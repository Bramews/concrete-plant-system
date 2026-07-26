const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { username: "cube" },
      select: { id: true, username: true, status: true },
    });
    fs.writeFileSync(
      "d:/concrete-plant-system/cube_raw_out.json",
      JSON.stringify(users, null, 2),
    );
  } catch (e) {
    fs.writeFileSync(
      "d:/concrete-plant-system/cube_raw_out.json",
      JSON.stringify({ error: e.message }, null, 2),
    );
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
