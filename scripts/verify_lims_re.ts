import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Starting LIMS Verification...");

  try {
    // 1. Verify Standards Existence
    console.log("\n1. Verifying Standards...");
    const standards = await prisma.labStandard.findMany({
      include: { testMethods: true },
    });

    const requiredStandards = ["ASTM C143", "ASTM C231", "ASTM C566"];
    const missingStandards = requiredStandards.filter(
      (code) => !standards.some((s) => s.code.includes(code.split(" ")[1])),
    );

    if (missingStandards.length > 0) {
      console.error("❌ Missing Standards:", missingStandards);
    } else {
      console.log("✅ All core standards found.");
    }

    // 2. Verify / Create Test Order
    console.log("\n2. Verifying Order Logic...");
    let order = await prisma.order.findFirst({
      where: { status: "PRODUCTION" },
    });

    if (!order) {
      console.log("⚠️ No active order found. Creating mock order...");

      let customer = await prisma.customer.findFirst();
      if (!customer) {
        customer = await prisma.customer.create({
          data: { name: "Test Customer", companyId: 1 },
        });
      }

      let mix = await prisma.mixDesign.findFirst();
      if (!mix) {
        mix = await prisma.mixDesign.create({
          data: { name: "C35 Test", code: "C35", companyId: 1 },
        });
      }

      order = await prisma.order.create({
        data: {
          orderNumber: `TEST-${Date.now()}`,
          companyId: 1,
          customerId: customer.id,
          mixDesignId: mix.id,
          volume: 10,
          status: "PRODUCTION",
          date: new Date(),
        },
      });
      console.log("✅ Mock Order Created:", order.orderNumber);
    } else {
      console.log("✅ Active Order Found:", order.orderNumber);
    }

    // 3. Simulate Fresh Concrete Test (Slump)
    console.log("\n3. Simulating Fresh Concrete Test...");
    const slumpMethod = await prisma.testMethod.findFirst({
      where: { code: "SLUMP" },
    });

    if (slumpMethod) {
      const test = await prisma.qualityTest.create({
        data: {
          orderId: order.id,
          methodId: slumpMethod.id,
          testedById: 1,
          value: 120,
          result: "PASS",
          notes: "Automated verification test",
        },
      });
      console.log(
        `✅ Fresh Concrete Test Saved: ID=${test.id} | Result=${test.result}`,
      );
    } else {
      console.error("❌ Slump method not found!");
    }

    // 4. Simulate Aggregate Test (Moisture)
    console.log("\n4. Simulating Aggregate Test...");
    const moistureMethod = await prisma.testMethod.findFirst({
      where: { code: "MOISTURE" },
    });

    const material = await prisma.material.findFirst({
      where: { status: "ACTIVE" },
    });

    if (moistureMethod && material) {
      const test = await prisma.qualityTest.create({
        data: {
          materialId: material.id,
          methodId: moistureMethod.id,
          testedById: 1,
          value: 2.5,
          readings: JSON.stringify({ wet: 500, dry: 488, cont: 0 }),
          result: "PASS",
          notes: "Automated verification test for aggregates",
        },
      });
      console.log(
        `✅ Aggregate Test Saved: ID=${test.id} | Material=${material.name}`,
      );
    } else {
      console.warn(
        "⚠️ Could not test aggregates (Missing method or material).",
      );
    }

    // 5. Verify Report Configuration
    console.log("\n5. Verifying Report Config...");
    const config = await prisma.labReportConfig.findUnique({
      where: { companyId: 1 },
    });

    if (config) {
      console.log(
        "✅ Report Config Present:",
        config.companyNameEn || "No Name Set",
      );
    } else {
      console.error("❌ Report Config Missing for Company 1");
      // Create default if missing
      await prisma.labReportConfig.create({
        data: {
          companyId: 1,
          companyNameEn: "Default Company",
          reportTitleEn: "Test Certificate",
        },
      });
      console.log("✅ Created default report config.");
    }
  } catch (e) {
    console.error("CRITICAL ERROR:", e);
  } finally {
    console.log("\n🎉 Verification Script Finished.");
    await prisma.$disconnect();
  }
}

main();
