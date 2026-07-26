import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("--- Current Users ---");
  users.forEach((u) => {
    console.log(
      `Username: ${u.username}, Role: ${u.role}, Status: ${u.status}`,
    );
  });
  console.log("---------------------");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
