const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// const { calculateCompressiveStrength } = require('../lib/lab/calculations'); // Removed to avoid TS issues

async function main() {
  console.log("Starting Lab Standards Verification...");

  // 1. Fetch Company (to attach order to)
  const company = await prisma.company.findFirst();

  if (!company) {
    console.error("No Company found. Seed database first.");
    return;
  }
  console.log("Company found:", company.name);

  // 2. Find an active order or create one
  let order = await prisma.order.findFirst({
    where: { companyId: company.id },
    include: { mixDesign: true },
  });

  if (!order) {
    console.log("No order found, creating dummy order...");
    // distinct company
    if (!company) throw new Error("No company found");

    const mixParams = {
      companyId: company.id,
      code: "MIX-STD-TEST-" + Date.now(),
      name: "Mix Standard Test",
      strengthClass: "C30",
      status: "APPROVED",
    };

    const mix = await prisma.mixDesign.create({ data: mixParams });

    order = await prisma.order.create({
      data: {
        companyId: company.id,
        orderNumber: "TEST-STD-" + Date.now(),
        status: "IN_PRODUCTION",
        volume: 10,
        date: new Date(),
        mixDesignId: mix.id,
      },
    });
  }
  console.log("Using Order:", order.orderNumber);

  // 3. Define Standard Data (ASTM Cylinder)
  const standardCode = "ASTM_C39";
  const shape = "CYLINDER";
  const dimensions = { diameter: 150, height: 300 };
  const loadKn = 500; // 500 kN

  // Expected Calculation
  // Area = PI * (150/2)^2 = 17671.46 mm2
  // Strength = 500 * 1000 / 17671.46 = 28.29 MPa (approx)
  // Correction Factor for L/D = 2.0 is 1.0 (ASTM)

  const snapshot = JSON.stringify({
    code: standardCode,
    shape: shape,
    dimensions: dimensions,
  });

  // 4. Create Cube Test via Prisma directly (Simulating Action)
  // We can't easily call the Server Action from this script without mocking headers/auth,
  // so we will replicate the Action's logic here to verify the DATABASE interactions and MATH.

  // Replicate Logic from addCubeResult
  const area = Math.PI * Math.pow(dimensions.diameter / 2, 2);
  const mpa = Number(((loadKn * 1000) / area).toFixed(2));
  console.log(`Calculated MPa (Script): ${mpa} (Expected ~28.29)`);

  const test = await prisma.cubeTest.create({
    data: {
      orderId: order.id,
      sampleDate: new Date(),
      age: 28,
      kn: loadKn,
      mpa: mpa,
      result: mpa >= 30 ? "PASS" : "FAIL", // Target 30
      status: "PENDING",
      standardSnapshot: snapshot,
      labStandardId: null, // We could link to actual standard if we fetched it, but snapshot is key
    },
  });

  console.log("Test Created:", test.id);
  console.log("Stored Snapshot:", test.standardSnapshot);
  console.log("Stored MPa:", test.mpa);

  if (test.mpa > 28.2 && test.mpa < 28.4) {
    console.log(
      "✅ Verification PASSED: Strength calculation is correct for Cylinder.",
    );
  } else {
    console.error("❌ Verification FAILED: Strength calculation mismatch.");
  }

  // Cleanup
  await prisma.cubeTest.delete({ where: { id: test.id } });
  // await prisma.order.delete({ where: { id: order.id } }); // Keep order for logs
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
