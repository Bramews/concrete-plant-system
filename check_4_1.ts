import { prisma } from "./lib/prisma";
import { getCompanyPlan } from "./lib/getCompanyPlan";

async function main() {
  console.log("🔍 Running System Verification...");

  // 1. Check Plans
  const plans = await prisma.plan.findMany();
  console.log(`✅ Plans in DB: ${plans.length}`);
  if (plans.length < 3) {
    console.error("❌ Plans missing!");
    process.exit(1);
  }

  // 2. Check Subscription
  const company = await prisma.company.findFirst({
    where: { slug: "concrete" },
    include: { subscription: true },
  });

  if (!company) {
    console.error("❌ Company 'concrete' not found!");
    process.exit(1);
  }

  if (!company.subscription) {
    console.error("❌ Subscription missing for company!");
    process.exit(1);
  }
  console.log(`✅ Company Subscription Status: ${company.subscription.status}`);

  // 3. Check Abstraction Layer
  const planDetails = await getCompanyPlan(company.id);
  if (!planDetails) {
    console.error("❌ getCompanyPlan returned null!");
    process.exit(1);
  }
  console.log(
    `✅ Resolved Plan: ${planDetails.plan.name} (${planDetails.plan.key})`,
  );
  console.log(`✅ Limits - Users: ${planDetails.limits.maxUsers}`);
  console.log(`✅ Features: ${planDetails.features.join(", ")}`);

  console.log("🎉 VERIFICATION PASSED!");
}

main()
  .catch((e) => {
    console.error("❌ ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
