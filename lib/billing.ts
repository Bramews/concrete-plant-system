import { prisma } from "@/lib/prisma";
// @ts-expect-error -- stripe types not installed in dev workspace
import Stripe from "stripe";

// Initialize Stripe (Mock or Real based on env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-01-27.acacia", // Use latest or matching version
});

export async function createCustomer(
  companyId: number,
  email: string,
  name: string,
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { companyId: companyId.toString() },
  });

  // Save stripeId to company or subscription
  // We accepted that Company or Subscription has stripeId.
  // Schema says Subscription has stripeId (subscription ID) and Invoice has stripeId.
  // Actually Company usually needs stripeCustomerId.
  // Let's assume we store it on Subscription for now or we missed adding stripeCustomerId to Company?
  // Checking schema: Subscription has stripeId (likely Subscription ID). Customer model exists but is for CRM.
  // We might store stripeCustomerId in Company settings or add a field.
  // For now we'll return it.
  return customer;
}

export async function createSubscription(
  companyId: number,
  planId: number,
  stripeCustomerId: string,
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  // In real implementation, map Plan ID to Stripe Price ID
  const priceId = "price_mock_" + plan.key;

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: priceId }],
    metadata: { companyId: companyId.toString() },
  });

  // DB Record
  await prisma.subscription.upsert({
    where: { companyId },
    update: {
      stripeId: subscription.id,
      status: subscription.status,
      planId: plan.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    create: {
      companyId,
      stripeId: subscription.id,
      status: subscription.status,
      planId: plan.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  return subscription;
}

export async function checkSubscriptionStatus(companyId: number) {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });

  if (!sub) return { active: false, reason: "No subscription" };

  if (sub.status !== "active" && sub.status !== "trialing") {
    return { active: false, reason: sub.status };
  }

  // Check if past due with grace period?
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
    // If status is still active in DB but date passed, maybe webhook failed?
    // Strict check:
    return { active: false, reason: "expired" };
  }

  return { active: true, plan: sub.plan };
}
