/*
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // Log webhook event
  await prisma.webhookEvent.create({
    data: {
      provider: "STRIPE",
      eventId: event.id,
      type: event.type,
      payload: JSON.stringify(event.data.object),
      status: "PROCESSED",
    },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.metadata?.companyId) break;

        const companyId = parseInt(session.metadata.companyId);

        await prisma.subscription.update({
          where: { companyId },
          data: {
            stripeId: session.subscription as string,
            status: "ACTIVE",
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Find subscription by stripeId
        const sub = await prisma.subscription.findUnique({
          where: { stripeId: subscriptionId },
        });

        if (sub) {
          await prisma.invoice.create({
            data: {
              companyId: sub.companyId,
              stripeId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: "PAID",
              pdfUrl: invoice.hosted_invoice_url,
              paidAt: new Date(),
            },
          });

          // Extend period
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              currentPeriodEnd: new Date(
                invoice.lines.data[0].period.end * 1000,
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeId: subscription.id },
          data: { status: "CANCELED" },
        });
        break;
      }
    }
  } catch (error: unknown) {
    console.error("Webhook processing failed:", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
*/

export async function POST() {
  return new Response("Stripe disabled for build", { status: 503 });
}
