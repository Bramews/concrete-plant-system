const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  let out = "--- Current Users ---\n";
  users.forEach((u) => {
    out += `Username: ${u.username}, Role: ${u.role}, Status: ${u.status}\n`;
  });
  out += "---------------------\n";
  fs.writeFileSync("users_report.txt", out);
}

main().catch((e) => {
  fs.writeFileSync("users_report.txt", "Error: " + e.message);
  process.exit(1);
});
