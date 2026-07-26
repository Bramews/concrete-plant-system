const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== PRISMA CLIENT VERIFICATION (JS) ===");
  try {
    // Access internal DMMF
    const dmmf = await prisma._getDmmf();
    if (!dmmf) {
      console.error("FAILED: No DMMF found.");
      return;
    }

    const userModel = dmmf.datamodel.models.find((m) => m.name === "User");
    if (!userModel) {
      console.error("FAILED: User model not found.");
      return;
    }

    const fields = userModel.fields.map((f) => f.name);
    console.log("User Model Fields: " + fields.join(", "));

    if (fields.includes("memberships")) {
      console.log('SUCCESS: "memberships" field FOUND.');
    } else {
      console.log('FAILURE: "memberships" field MISSING.');
    }
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
