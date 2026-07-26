import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Starting Prisma Client Verification...");
  try {
    // Access internal DMMF to see what the client actually knows
    // @ts-ignore
    const dmmf = await prisma._getDmmf();
    if (!dmmf) {
      console.error("❌ Could not load DMMF.");
      return;
    }

    const orderModel = dmmf.datamodel.models.find(
      (m: any) => m.name === "Order",
    );

    if (!orderModel) {
      console.error("❌ Order model NOT found in Prisma Client!");
      return;
    }

    console.log("✅ Order model found.");
    const fields = orderModel.fields.map((f: any) => f.name);
    console.log("📋 Available Order fields:", fields.join(", "));

    const hasApproval = fields.includes("approval");
    if (hasApproval) {
      console.log(
        '✅ SUCCESS: "approval" field exists in the generated client.',
      );
    } else {
      console.error(
        '❌ FAILURE: "approval" field is MISSING from the generated client.',
      );
      console.error("   Current fields are:", fields);
    }
  } catch (e) {
    console.error("❌ Error running verification:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
