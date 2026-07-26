import { createBatch } from "../app/actions/production";
import { prisma } from "../lib/prisma";

async function runStressTest() {
  console.log("🚀 Starting Phase 2 Stress Test...");

  // 1. Setup: Ensure an approved order exists
  let order = await prisma.order.findFirst({
    where: { status: "LAB_APPROVED" },
  });

  if (!order) {
    console.log("⚠️ No LAB_APPROVED order found. Creating one for test...");
    order = await prisma.order.create({
      data: {
        orderNumber: "STRESS-TEST-" + Date.now(),
        customerId: 1,
        projectId: 1,
        mixDesignId: 1,
        originalQuantity: 100,
        actualQuantity: 0,
        status: "LAB_APPROVED",
      },
    });
  }

  const orderId = order.id;
  const requestId = "STRESS-TOKEN-" + Date.now();

  console.log(
    `📡 Simulating 50 concurrent requests for Order ${orderId} with Idempotency Token ${requestId}...`,
  );

  const requests = Array.from({ length: 50 }).map(async (_, i) => {
    const formData = new FormData();
    formData.append("orderId", orderId.toString());
    formData.append("quantity", "1.0");
    formData.append("truckNumber", `TRUCK-${i}`);
    formData.append("driverName", `DRIVER-${i}`);
    formData.append("requestId", requestId); // SAME TOKEN for all to test idempotency

    try {
      return await createBatch(formData);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  const results = await Promise.all(requests);

  const successes = results.filter((r: any) => r.success).length;
  const idempotencyRejections = results.filter(
    (r: any) => r.error === undefined && r.success === true,
  ).length; // Depending on implementation
  const errors = results.filter((r: any) => r.error).length;

  console.log("📊 Results Summary:");
  console.log(`- Total Requests: 50`);
  console.log(`- Successes (First processing): ${successes}`);
  console.log(`- Errors/Rejections: ${errors}`);

  // Verification
  const batchCount = await prisma.batch.count({ where: { orderId } });
  const ticketCount = await prisma.deliveryTicket.count({ where: { orderId } });

  console.log(`📈 Database Verification:`);
  console.log(`- Total Batches created: ${batchCount}`);
  console.log(`- Total Tickets created: ${ticketCount}`);

  if (batchCount === 1 && ticketCount === 1) {
    console.log(
      "✅ PASS: Idempotency enforced correctly. Only 1 record created.",
    );
  } else {
    console.log("❌ FAIL: Duplicate records detected!");
  }

  // Test 2: Different Tokens, Same OrderId (Locking Test)
  console.log(
    `\n📡 Simulating 10 concurrent requests with UNIQUE tokens for Order ${orderId} (Locking Test)...`,
  );

  const lockRequests = Array.from({ length: 10 }).map(async (_, i) => {
    const formData = new FormData();
    formData.append("orderId", orderId.toString());
    formData.append("quantity", "0.1");
    formData.append("truckNumber", `LOCK-T-${i}`);
    formData.append("driverName", `LOCK-D-${i}`);
    formData.append("requestId", `UNIQUE-TOKEN-${i}-${Date.now()}`);

    try {
      return await createBatch(formData);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  const lockResults = await Promise.all(lockRequests);
  const lockConcurrencyErrors = lockResults.filter((r: any) =>
    r.error?.includes("CONCURRENCY_ERROR"),
  ).length;

  console.log(
    `- Lock Contention (Concurrency Errors): ${lockConcurrencyErrors}`,
  );
  console.log("✅ Stress test completed.");
}

runStressTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
