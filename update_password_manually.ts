// @ts-nocheck
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "test7@112";
  console.log("Updating plainPassword for:", username);

  try {
    const result = await prisma.user.update({
      where: { username },
      data: { plainPassword: "MANUAL_TEST_123" },
    });
    console.log("Update Success:", result.plainPassword);
  } catch (e) {
    console.error("Update Failed:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
