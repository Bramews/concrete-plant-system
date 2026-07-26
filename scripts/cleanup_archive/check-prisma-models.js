const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkModels() {
  console.log("\n=== Checking Prisma Client Models ===\n");

  // List all available models
  const models = Object.keys(prisma).filter(
    (key) => typeof prisma[key] === "object" && prisma[key].findMany,
  );

  console.log("Available Models:");
  models.forEach((model) => console.log(`  - ${model}`));

  console.log(`\n Total Models: ${models.length}`);

  // Check for specific models
  console.log("\n=== Checking for Required Models ===\n");
  const requiredModels = [
    "membership",
    "session",
    "systemOwner",
    "role",
    "permission",
    "rolePermission",
    "impersonationSession",
  ];

  requiredModels.forEach((model) => {
    const exists = models.includes(model);
    console.log(`  ${model}: ${exists ? "✅ EXISTS" : "❌ MISSING"}`);
  });

  await prisma.$disconnect();
}

checkModels().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
