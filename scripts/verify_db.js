const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  let content = "Users in DB:\n";
  users.forEach((u) => {
    content += `- ${u.username} (${u.role})\n`;
  });
  fs.writeFileSync("db_check.txt", content);
  console.log("DB Check written to db_check.txt");
}

main().catch((err) => {
  fs.writeFileSync("db_check.txt", "Error: " + err.message);
});
